"use client";

import React, { useMemo, useCallback, useState, useEffect, useRef } from "react";
import {
    Box,
    Text,
    Button,
    Flex,
    Badge,
    HStack,
    Icon,
} from "@chakra-ui/react";
import { LuX } from "react-icons/lu";

import { issueColumns, issueDataColumns } from "../../Issue/isseColumns";


import { useStoneItems } from "@/hooks/item/useItems";
import { useCalculatePure } from "@/hooks/pure/useCalculatePure";
import { useTagedDetailsByTagNo } from "@/hooks/tag/useTag";

import StoneEnterMaster from "../StoneMaster/StoneEntryMaster";
import OtherChargesWindow from "../OtherCharges/OtherChargesWindow";

import { SelectCombobox } from "@/components/ui/selectComboBox";
import { useGlobalKey } from "@/components/key/useGlobalKey";
import TransactionTable from "@/component/table/TransactionTable";
import { toaster } from "@/components/ui/toaster";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { SwitchInput } from "@/components/ui/SwitchInput";

type StoneRow = {
    id: string;
    draftRowId: string;
    stoneId: string;
    subStoneId: string;
    stonePcs: number;
    stoneWeight: number;
    stoneUnit: "g" | "c";
    stoneCalculation: "w" | "p";
    stoneRate: number;
    stoneAmount: number;
};

export interface FormField {
    key: string;
    label?: string;
    type: "text" | "number" | "select" | "combobox" | "capitalized" | "calculated";
    placeholder?: string;
    collection?: { items: { label: string; value: string }[] };
    getLabelByValue?: (collection: any, value: any) => string;
    isRequired?: boolean;
    min?: number;
    max?: number;
    allowNegative?: boolean;
    size?: "2xs" | "xs" | "sm" | "md" | "lg";
    disabled?: boolean;
    decimalScale?: number;
    dependsOn?: string;
    defaultValue?: string;

}

interface DraftTransactionTableProps {
    rows: any[];
    // 🔥 FIX: Replace editingRowId with editingState
    editingState: { rowId: string | null; transactionType: string | null };
    onAddRow: (formData?: any) => void;
    onUpdateRow: (rowIndex: number, field: string, value: any) => void;
    onRemoveRow: (rowId: string) => void;
    onRowClick: (row: any, transactionType: string) => void;
    onCancelEdit: (rowId?: string) => void;
    itemsCollection: any;
    totals: any;
    transactionTitle: string | undefined;
    theme: any;
    isEditing: boolean;
    isIssue?: boolean;
    getAvailableWeight?: (id: string | number, options?: { excludeRowId?: string, isEditing?: boolean, originalWeight?: number, transactionTypeCode?: string }) => number | null;
    onClear?: () => void;
    transactionType?: string;
    initialFormData?: any;
    onFormDataChange?: (data: any) => void;
    getStockAvailability?: (id: string, options?: { excludeRowId?: string, transactionTypeCode: string, isEditing?: boolean, originalWeight?: number }) => any | undefined;
    otherChargesList: { label: string; value: string; }[];
    otherChargesData: any;
    getAvailablePieces?: (id: string, options?: { excludeRowId?: string, transactionTypeCode: string, isEditing?: boolean, originalPieces?: number }) => any | undefined;
    handleTagChange : () => void ;
    isTag :boolean;
    onTagNoLookup?: (tagNo: string) => Promise<{
        GRSWT: number;
        STNWT: number;
        NETWT: number;
        WASPER: number;
        DIAWT: number;
        MC: number;
        TOUCH: number;
        SALESSTNWT: number;
        SIZEID: number;
        ITEMID?: string;
        PCS?: number;
    } | null>;
}



const getWidth = (width: string | number) => width || "30px";


function InlineSelect({
    value, onChange, collection, inputRef, onEnter, disabled, isInvalid,
}: {
    value: string; onChange: (v: string) => void;
    collection?: { items: { label: string; value: string }[] };
    isInvalid?: boolean;
    inputRef?: React.RefObject<HTMLSelectElement>;
    onEnter?: () => void; disabled?: boolean;
}) {
    const localRef = useRef<HTMLSelectElement>(null);
    const ref = (inputRef || localRef) as React.RefObject<HTMLSelectElement>;
    const safeItems = collection?.items || [];

    return (
        <select
            ref={ref}
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onEnter?.(); } }}
            disabled={disabled}
            style={{
                width: "100%", height: 22, fontSize: 10, borderRadius: 3,
                border: isInvalid ? "1px solid #FC8181" : "1px solid transparent",
                outline: "none", padding: "0 4px",
                background: disabled ? "#F7FAFC" : "white",
            }}
        >
            {safeItems.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    );
}

export default function DraftTransactionTable({
    rows,
    // 🔥 FIX: Use editingState instead of editingRowId
    editingState,
    onAddRow,
    onUpdateRow,
    onRemoveRow,
    onRowClick,
    onCancelEdit,
    itemsCollection,
    totals,
    transactionTitle,
    theme,
    isEditing,
    isIssue,
    getAvailableWeight,
    onClear,
    transactionType,
    initialFormData,
    onFormDataChange,
    getStockAvailability,
    otherChargesList,
    otherChargesData,
    getAvailablePieces,
    isTag,
    handleTagChange,
    onTagNoLookup
}: DraftTransactionTableProps) {

    console.log(totals, 'totals')

    // 🔥 FIX: Get the current editing row ID and its transaction type
    const currentEditingRowId = editingState?.rowId;
    const currentEditingTransactionType = editingState?.transactionType;

    // Check if this table should be in editing mode
    const isThisTableEditing = currentEditingRowId !== null &&
        currentEditingTransactionType === transactionType;

    // FIX: Separate state for each modal's draft row ID
    const [stoneDraftRowId, setStoneDraftRowId] = useState<string>("");
    const [miscDraftRowId, setMiscDraftRowId] = useState<string>("");

    const stoneModalOpenedRef = useRef(false);
    const miscModalOpenedRef = useRef(false);

    // Separate temp ID refs
    const stoneTempId = useRef<string | null>(null);
    const miscTempId = useRef<string | null>(null);

    const { data: stoneItemsData } = useStoneItems();
    const [stoneItemsCollection, setStoneItemCollection] = useState<{ label: string; value: string }[]>([]);
    // 2. Add state + hook at component level
    const [pendingTagNo, setPendingTagNo] = useState<string>("");
    const { data: tagData, isLoading: isTagLoading } = useTagedDetailsByTagNo(pendingTagNo);

    console.log(tagData,'tagData');


    const pendingStoneData = useRef<{
        tempId: string;
        stones: StoneRow[];
        totalWeight: number;
    } | null>(null);

    const pendingMiscData = useRef<{
        tempId: string;
        charges: any[];
        totalAmount: number;
    } | null>(null);



    // rowsRef so setTimeout closures always see latest rows
    console.log(rows, 'rows in draft table')
    const rowsRef = useRef(rows);
    console.log(rowsRef.current, 'rows in draft table')
    useEffect(() => { rowsRef.current = rows; }, [rows]);

    useEffect(() => {
        if (!stoneItemsData) return;
        setStoneItemCollection(
            stoneItemsData.map((item: any) => ({
                label: item.itemName,
                value: item.itemId.toString(),
            }))
        );
    }, [stoneItemsData]);

    

    const [formData, setFormData] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isStoneModalOpen, setIsStoneModalOpen] = useState(false);
    const [isMiscModalOpen, setIsMiscModalOpen] = useState(false);
    const [currentGRSWT, setCurrentGRSWT] = useState<number>(0);

    const fieldRefs = useRef<Record<string, React.RefObject<any>>>({});
    const submitBtnRef = useRef<HTMLButtonElement>(null);

    const wastypecollection = useMemo(
        () => ({ items: [{ label: "TOUCH", value: "TOUCH" }] }),
        []
    );

    const numericFields = useMemo(() => [
        "PCS", "GRSWT", "STNWT", "NETWT", "WASPER", "WASTAGE", "STNAMT",
        "PUREWT", "HMC", "MC", "WT", "TOUCH", "AWT", "APUREWT"
    ], []);


    const orderedKeys = useMemo(() => {
        if (isIssue) return ["PUREID", "WT", "AWT", "TOUCH", "ATOUCH", "PUREWT", "APUREWT"];

        const isReturn = transactionTitle?.toLowerCase() === "return";
        const showTag = isReturn && isTag;

        return showTag
            ? ["TAGNO", "ITEMID", "PCS", "GRSWT", "STNWT", "NETWT", "WASTYPE", "WASPER", "WASTAGE", "TOUCH", "PUREWT", "HMC", "MC", "STNAMT", "DESCRIPTION"]
            : ["ITEMID", "PCS", "GRSWT", "STNWT", "NETWT", "WASTYPE", "WASPER", "WASTAGE", "TOUCH", "PUREWT", "HMC", "MC", "STNAMT", "DESCRIPTION"];
    }, [isIssue, isTag, transactionTitle]);  // ✅ add transactionTitle to deps


    const baseColumns = isIssue ? issueDataColumns : issueColumns(isTag);
    const colMap = useMemo(() => new Map(baseColumns.map(c => [c.key, c])), [baseColumns]);
    const tableCols = useMemo(() =>
        orderedKeys.map(k => colMap.get(k)).filter(Boolean) as any[],
        [isIssue, colMap]
    );

    console.log(tableCols,'tableCols')

    // Separate temp ID getters/resetters
    const getStoneTempId = () => {
        if (!stoneTempId.current) {
            stoneTempId.current = `stone-form-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        }
        return stoneTempId.current;
    };

    const getMiscTempId = () => {
        if (!miscTempId.current) {
            miscTempId.current = `misc-form-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        }
        return miscTempId.current;
    };

    const resetStoneTempId = () => { stoneTempId.current = null; };
    const resetMiscTempId = () => { miscTempId.current = null; };

    // Stone modal: only uses stoneDraftRowId
    const handleOpenStoneModal = (grsWeight: number) => {
        if (stoneModalOpenedRef.current) return;
        stoneModalOpenedRef.current = true;
        setCurrentGRSWT(grsWeight);

        // 🔥 FIX: Use currentEditingRowId instead of editingRowId
        if (currentEditingRowId) {
            setStoneDraftRowId(currentEditingRowId as string);
        } else {
            setStoneDraftRowId(getStoneTempId());
        }

        setIsStoneModalOpen(true);
        setTimeout(() => { stoneModalOpenedRef.current = false; }, 500);
    };

    // Misc modal: only uses miscDraftRowId
    const handleOpenMiscModal = () => {
        if (miscModalOpenedRef.current) return;
        miscModalOpenedRef.current = true;

        let idToUse: string;

        // 🔥 FIX: Use currentEditingRowId instead of editingRowId
        if (currentEditingRowId) {
            idToUse = currentEditingRowId as string;
            console.log("Opening misc modal for existing row:", idToUse);

            const allCharges = JSON.parse(localStorage.getItem("MISC_CHARGE_MASTER") || "[]");
            const rowCharges = allCharges.filter((c: any) => c.draftRowId === idToUse);
            if (rowCharges.length > 0) {
                const total = rowCharges.reduce((sum: number, c: any) => sum + c.amount, 0);
                pendingMiscData.current = { tempId: idToUse, charges: rowCharges, totalAmount: total };
                handleChange("HMC", total.toFixed(2));
            }
        } else if (miscDraftRowId) {
            // Reuse existing misc temp ID — stone modal closing never touches this
            idToUse = miscDraftRowId;
            console.log("Reusing existing misc ID:", idToUse);

            const allCharges = JSON.parse(localStorage.getItem("MISC_CHARGE_MASTER") || "[]");
            const rowCharges = allCharges.filter((c: any) => c.draftRowId === idToUse);
            if (rowCharges.length > 0) {
                const total = rowCharges.reduce((sum: number, c: any) => sum + c.amount, 0);
                pendingMiscData.current = { tempId: idToUse, charges: rowCharges, totalAmount: total };
                handleChange("HMC", total.toFixed(2));
            }
        } else {
            idToUse = getMiscTempId();
            console.log("Created new misc temp ID:", idToUse);
        }

        setMiscDraftRowId(idToUse);
        setIsMiscModalOpen(true);
        setTimeout(() => { miscModalOpenedRef.current = false; }, 500);
    };

    const closeStoneModal = () => {
        setIsStoneModalOpen(false);
        setStoneDraftRowId("");
    };

    const closeOtherChargeModal = () => {
        setIsMiscModalOpen(false);
        resetMiscTempId();
    }

    const formFields = useMemo<FormField[]>(() => {
        return tableCols.map((col): FormField => {
            const isNum = numericFields.includes(col.key);
            const isRequired = isIssue
                ? ["PUREID", "TOUCH", "WT"].includes(col.key)
                : ["ITEMID", "PCS", "GRSWT", "TOUCH", "HMC"].includes(col.key);

            const base: FormField = {
                key: col.key,
                label: col.label || col.key || "",
                placeholder: col.label || col.key,
                type: isNum ? "number" : "text",
                isRequired,
                size: "xs",
                ...("decimalScale" in col && typeof col.decimalScale === "number"
                    ? { decimalScale: col.decimalScale } : {}),
            };

            if (col.key === "ITEMID" || col.key === "PUREID")
                return { ...base, type: "combobox", collection: itemsCollection || { items: [] }, isRequired: true };

            // if (col.key === "ITEMCODE" || col.key === "HSNCODE")
            //     return { ...base, type: "capitalized" };

            if (col.key === "WASTYPE")
                return { ...base, type: "select", collection: wastypecollection, isRequired: true, dependsOn: "ITEMID", defaultValue: "TOUCH" };

            if (!isIssue && ["NETWT", "PUREWT"].includes(col.key))
                return { ...base, type: "calculated", disabled: true };

            if (isIssue && ["PUREWT", "APUREWT"].includes(col.key))
                return { ...base, type: "calculated", disabled: true };


            // In formFields useMemo:
            if (!isIssue && ["PCS", "GRSWT", "STNWT", "WASTYPE", "WASPER", "WASTAGE", "MC", "HMC", "TOUCH", "STNAMT", "DESCRIPTION"].includes(col.key)) {
                // ✅ When isTag, these fields get filled by TAGNO lookup — no dependsOn lock needed
                return { ...base, dependsOn: isTag ? undefined : "ITEMID" };
            }

            if (isIssue && ["WT", "AWT", "TOUCH", "ATOUCH"].includes(col.key))
                return { ...base, dependsOn: "PUREID" };

            if (!isIssue && ["STNAMT"].includes(col.key))
                return { ...base, type: "calculated", disabled: true };

            if (col.key === "TAGNO") {
                const isReturn = transactionTitle?.toLowerCase() === "return";
                return {
                    ...base,
                    type: "text",
                    isRequired: isReturn && isTag,
                    disabled: false,
                };
            }

            return base;
        });
    }, [tableCols, itemsCollection, isIssue ,isTag ,transactionTitle]);

    const visibleFormFields = useMemo(() =>
        formFields.filter(f => !["NETWT", "PUREWT", "APUREWT"].includes(f.key) && f.type !== "calculated"),
        [formFields]
    );

    const formFieldsRef = useRef(formFields);
    useEffect(() => { formFieldsRef.current = formFields; }, [formFields]);


    const onRowClickRef = useRef(onRowClick);
    useEffect(() => { onRowClickRef.current = onRowClick; }, [onRowClick]);

    useEffect(() => {
        if (!initialFormData) return;
        const next: Record<string, any> = {};
        formFieldsRef.current.forEach(f => {   // ✅ use ref
            if (f.type === "number" && initialFormData[f.key] !== undefined) {
                next[f.key] = initialFormData[f.key].toString();
            } else {
                next[f.key] = initialFormData[f.key] ?? f.defaultValue ?? "";
            }
        });
        setFormData(next);
        if (initialFormData.__rowId) {
            onRowClickRef.current(initialFormData, transactionType || "");  // ✅ use ref
        }
    }, [initialFormData, transactionType]);


    useEffect(() => {
        visibleFormFields.forEach(f => {
            if (!fieldRefs.current[f.key]) {
                fieldRefs.current[f.key] = React.createRef<any>();
            }
        });
    }, [visibleFormFields]);


    const pureValue = useCalculatePure(formData.WT, formData.TOUCH);

    console.log(pureValue, 'pureValue')
    const altPureValue = useCalculatePure(formData.AWT, formData.ATOUCH);

    const calcNet = useCallback(() => {
        const g = parseFloat(formData.GRSWT) || 0;
        const s = parseFloat(formData.STNWT) || 0;
        return (g - s).toFixed(3);
    }, [formData.GRSWT, formData.STNWT]);

    const calcPure = useCallback(() => {
        const n = parseFloat(calcNet()) || 0;
        const t = parseFloat(formData.TOUCH) || 0;
        return ((n * t) / 100).toFixed(3);
    }, [calcNet, formData.TOUCH]);


    useEffect(() => {
        const g = parseFloat(formData.GRSWT) || 0;
        const s = parseFloat(formData.STNWT) || 0;
        const t = parseFloat(formData.TOUCH) || 0;
        const netwt = (g - s).toFixed(3);
        const purewt = ((g - s) * t / 100).toFixed(3);

        setFormData(prev => {
            // ✅ Only update if values actually changed — prevents infinite loop
            if (prev.NETWT === netwt && prev.PUREWT === purewt) return prev;
            return { ...prev, NETWT: netwt, PUREWT: purewt };
        });
    }, [formData.GRSWT, formData.STNWT, formData.TOUCH]);

    useEffect(() => {
        if (pureValue) setFormData(p => ({ ...p, PUREWT: pureValue }));
        if (altPureValue) setFormData(p => ({ ...p, APUREWT: altPureValue }));
    }, [pureValue]);

    useEffect(() => {
        const init: Record<string, any> = {};
        formFields.forEach(f => { init[f.key] = f.defaultValue ?? ""; });
        setFormData(init);
    }, []); // ✅ empty — only on mount

    // 🔥 FIX: Populate form + load stones/misc when currentEditingRowId changes
    useEffect(() => {
        if (currentEditingRowId && currentEditingTransactionType === transactionType) {
            const rowToEdit = rows.find(r => r.__rowId === currentEditingRowId);
            if (rowToEdit) {
                const next: Record<string, any> = {};
                formFieldsRef.current.forEach(f => {   // ✅ use ref, not formFields
                    if (f.type === "number" && rowToEdit[f.key] !== undefined) {
                        next[f.key] = rowToEdit[f.key].toString();
                    } else {
                        next[f.key] = rowToEdit[f.key] ?? f.defaultValue ?? "";
                    }
                });
                setFormData(next);

                // Load stones
                const allStones = JSON.parse(localStorage.getItem("STONE_MASTER") || "[]");
                const rowStones = allStones.filter((s: StoneRow) => s.draftRowId === currentEditingRowId);
                if (rowStones.length > 0) {
                    const totalStoneWeight = rowStones.reduce(
                        (sum: any, s: any) => sum + (s.stoneUnit === "c" ? s.stoneWeight / 5 : s.stoneWeight), 0
                    );
                    if (totalStoneWeight > 0) {
                        setFormData(prev => ({ ...prev, STNWT: totalStoneWeight.toFixed(3) }));
                    }
                    pendingStoneData.current = { tempId: currentEditingRowId as string, stones: rowStones, totalWeight: totalStoneWeight };
                    setStoneDraftRowId(currentEditingRowId as string);
                }

                // Load misc charges
                const allCharges = JSON.parse(localStorage.getItem("MISC_CHARGE_MASTER") || "[]");
                const rowCharges = allCharges.filter((c: any) => c.draftRowId === currentEditingRowId);
                if (rowCharges.length > 0) {
                    const totalMiscAmount = rowCharges.reduce((sum: any, c: any) => sum + (c.amount || 0), 0);
                    setFormData(prev => ({ ...prev, HMC: totalMiscAmount.toFixed(2) }));
                    pendingMiscData.current = { tempId: currentEditingRowId as string, charges: rowCharges, totalAmount: totalMiscAmount };
                    setMiscDraftRowId(currentEditingRowId as string);
                }

                setErrors({});
                setTouched({});
            }
        }
    }, [currentEditingRowId, currentEditingTransactionType, transactionType, rows]);

    // 3. React to the result
    useEffect(() => {
        if (!pendingTagNo || !tagData) return;

        // handleChange({
        //     GRSWT: tagData.GRSWT?.toString() || "0",
        //     STNWT: tagData.STNWT?.toString() || "0",
        //     NETWT: tagData.NETWT?.toString() || "0",
        //     WASPER: tagData.WASPER?.toString() || "0",
        //     MC: tagData.MC?.toString() || "0",
        //     TOUCH: tagData.TOUCH?.toString() || "0",
        //     SALESSTNWT: tagData.SALESSTNWT?.toString() || "0",
        //     PCS: (tagData.PCS ?? 1).toString(),
        //     ...(tagData.ITEMID ? { ITEMID: tagData.ITEMID.toString() } : {}),
        // });

        toaster.create({
            title: "Tag Loaded",
            description: `Details filled for tag: ${pendingTagNo}`,
            type: "success",
            duration: 1500,
        });

        setPendingTagNo(""); // ✅ resets → hook disables (enabled: !!id = false)
        setTimeout(() => moveNext("TAGNO"), 100);
    }, [tagData]);

    type FormData = typeof formData;

    const handleChange = useCallback(
        (keyOrObject: string | Partial<FormData>, value?: any) => {
            let next = { ...formData };

            if (typeof keyOrObject === "string") {
                next[keyOrObject] = value;
            } else {
                next = { ...next, ...keyOrObject };
            }

            // Handle mirror logic for WT and TOUCH
            if (typeof keyOrObject === "string") {
                // Single field change
                if (keyOrObject === "WT") {
                    // When WT changes, update AWT to match
                    next.AWT = value;
                } else if (keyOrObject === "TOUCH") {
                    // When TOUCH changes, update ATOUCH to match
                    next.ATOUCH = value;
                }
                // If AWT or ATOUCH are changed directly, we don't mirror anything
            } else {
                // Multiple fields changed
                if (keyOrObject.hasOwnProperty('WT')) {
                    next.AWT = keyOrObject.WT;
                }
                if (keyOrObject.hasOwnProperty('TOUCH')) {
                    next.ATOUCH = keyOrObject.TOUCH;
                }
            }

            // Calculate the actual values
            const wt = parseFloat(next.WT || 0);
            const awt = parseFloat(next.AWT || 0);
            const atouch = parseFloat(next.ATOUCH || 0);

            // Recalculate NETWT / PUREWT if relevant
            const g = parseFloat(next.GRSWT || 0);
            const s = parseFloat(next.STNWT || 0);
            next.NETWT = (g - s).toFixed(3);
            const touch = parseFloat(next.TOUCH || 0);

            next.PUREWT = isIssue ? (wt * touch / 100).toFixed(3) : ((g - s) * touch / 100).toFixed(3);
            next.APUREWT = (awt * atouch / 100).toFixed(3);

            setFormData(next);

            // Mark touched fields
            if (typeof keyOrObject === "string") {
                setTouched(p => ({ ...p, [keyOrObject]: true }));
                setErrors(p => ({ ...p, [keyOrObject]: "" }));
            } else {
                Object.keys(keyOrObject).forEach(k => {
                    setTouched(p => ({ ...p, [k]: true }));
                    setErrors(p => ({ ...p, [k]: "" }));
                });
            }
        },
        [formData, isIssue]
    );




    // console.log(visibleFormFields,'visibleFormFields');
    const focusIdx = useCallback((idx: number) => {
        const f = visibleFormFields[idx];

        if (!f) return;
        const ref = fieldRefs.current[f.key];
        setTimeout(() => { ref?.current?.focus?.(); ref?.current?.select?.(); }, 60);
    }, [visibleFormFields]);

    const moveNext = useCallback((key: string) => {
        const idx = visibleFormFields.findIndex(f => f.key === key);
        // console.log(idx,'idsx');
        let next = idx + 1;
        while (
            next < visibleFormFields.length &&
            (visibleFormFields[next].disabled ||
                (visibleFormFields[next].dependsOn && !formData[visibleFormFields[next].dependsOn!]))
        ) next++;
        if (next < visibleFormFields.length) focusIdx(next);
        else submitBtnRef.current?.click();
    }, [visibleFormFields, formData, focusIdx]);

    const validateForm = useCallback((): boolean => {
        const errs: Record<string, string> = {};
        let valid = true;
        visibleFormFields.forEach(f => {
            const val = formData[f.key];
            if (f.isRequired && (!val || val.toString().trim() === "")) {
                errs[f.key] = `${f.label} is required`;
                valid = false;
            }
        });
        const allTouched: Record<string, boolean> = {};
        visibleFormFields.forEach(f => { allTouched[f.key] = true; });
        setTouched(allTouched);
        setErrors(errs);

        if (!valid) {
            const firstErrField = visibleFormFields.find(f => errs[f.key]);
            if (firstErrField) {
                focusIdx(visibleFormFields.findIndex(f => f.key === firstErrField.key));
                toaster.create({ title: "Validation Error", description: errs[firstErrField.key], type: "error" });
            }
        }
        return valid;
    }, [visibleFormFields, formData, focusIdx]);

    const resetForm = useCallback(() => {
        onCancelEdit?.();
        const reset: Record<string, any> = {};
        formFields.forEach(f => { reset[f.key] = f.defaultValue ?? ""; });
        setFormData(reset);
        setErrors({});
        setTouched({});

        // Reset both IDs independently
        resetStoneTempId();
        resetMiscTempId();
        setStoneDraftRowId("");
        setMiscDraftRowId("");
        focusIdx(0);
    }, [formFields]);


    const handleSubmit = useCallback(async () => {
        if (!validateForm()) return;

        // Common validation for both types
        if (transactionType === "ISP") {
            if (Number(formData.WT) <= 0) {
                toaster.create({
                    title: "Invalid Weight",
                    description: "Weight must be greater than 0",
                    type: "error"
                });
                return;
            }
        } else if (transactionType === "PR") {
            if (Number(formData.PCS) <= 0) {
                toaster.create({
                    title: "Invalid Pieces",
                    description: "Pieces must be greater than 0",
                    type: "error"
                });
                return;
            }
            if (Number(formData.NETWT) <= 0) {
                toaster.create({
                    title: "Invalid Net Weight",
                    description: "Net weight must be greater than 0",
                    type: "error"
                });
                return;
            }
        }

        // Stock availability check for both ISP and PR
        const stockId = transactionType === "ISP" ? formData.PUREID : formData.ITEMID;

        if (stockId) {
            const isEditing = !!(currentEditingRowId && currentEditingTransactionType === transactionType);

            // Get the appropriate value based on transaction type
            let requestedValue = 0;
            let originalValue = 0;
            let valueField = '';

            if (transactionType === "ISP") {
                requestedValue = Number(formData.WT) || 0;
                originalValue = isEditing ? Number(formData._originalWeight) || 0 : 0;
                valueField = 'WT';
            } else if (transactionType === "PR") {
                // For PR, we need to check both pieces and net weight
                const requestedPieces = Number(formData.PCS) || 0;
                const requestedNetwt = Number(formData.NETWT) || 0;

                // Check pieces availability
                const availablePieces = getAvailablePieces?.(stockId, {
                    excludeRowId: isEditing ? currentEditingRowId : undefined,
                    isEditing: isEditing,
                    originalPieces: isEditing ? Number(formData._originalPieces) || 0 : 0,
                    transactionTypeCode: transactionType,
                }) ?? null;

                if (availablePieces !== null && requestedPieces > availablePieces) {
                    toaster.create({
                        title: "Insufficient Stock",
                        description: `Requested pieces ${requestedPieces} exceeds available stock ${availablePieces}`,
                        type: "error"
                    });
                    return;
                }

                // Check net weight availability
                const availableWeight = getAvailableWeight?.(stockId, {
                    excludeRowId: isEditing ? currentEditingRowId : undefined,
                    isEditing: isEditing,
                    originalWeight: isEditing ? Number(formData._originalNetwt) || 0 : 0,
                    transactionTypeCode: transactionType,
                }) ?? null;

                if (availableWeight !== null && requestedNetwt > availableWeight) {
                    toaster.create({
                        title: "Insufficient Stock",
                        description: `Requested net weight ${requestedNetwt.toFixed(3)}g exceeds available stock ${availableWeight.toFixed(3)}g`,
                        type: "error"
                    });
                    return;
                }

                // If both checks pass, continue
            } else {
                // For other transaction types (REC, PU) - skip stock check or handle differently
                console.log('Skipping stock check for transaction type:', transactionType);
            }

            // For ISP weight check
            if (transactionType === "ISP") {
                const availableWeight = getAvailableWeight?.(stockId, {
                    excludeRowId: isEditing ? currentEditingRowId : undefined,
                    isEditing: isEditing,
                    originalWeight: originalValue,
                    transactionTypeCode: transactionType,
                }) ?? null;

                if (availableWeight !== null && requestedValue > availableWeight) {
                    toaster.create({
                        title: "Insufficient Stock",
                        description: `Requested weight ${requestedValue.toFixed(3)}g exceeds available stock ${availableWeight.toFixed(3)}g`,
                        type: "error"
                    });
                    return;
                }
            }
        }

        setIsSubmitting(true);
        try {
            const submitData: any = {
                ...formData,
                NETWT: calcNet(),
                PUREWT: isIssue ? pureValue : calcPure(),
                WASTYPE: formData.WASTYPE || "TOUCH",
            };

            const currentMiscData = pendingMiscData.current;
            const currentStoneData = pendingStoneData.current;

            if (currentStoneData) {
                submitData._stoneTempId = currentStoneData.tempId;
                submitData._stones = currentStoneData.stones;
                submitData._stoneTotalWeight = currentStoneData.totalWeight;
            }

            if (currentMiscData) {
                submitData._miscTempId = currentMiscData.tempId;
                submitData._miscCharges = currentMiscData.charges;
                submitData._miscTotalAmount = currentMiscData.totalAmount;
                if (currentMiscData.totalAmount > 0) {
                    submitData.HMC = currentMiscData.totalAmount.toFixed(2);
                }
            }

            // Handle edit or new row
            if (currentEditingRowId && currentEditingTransactionType === transactionType) {
                const rowIndex = rows.findIndex(r => r.__rowId === currentEditingRowId);
                if (rowIndex === -1) {
                    console.error("Row not found for update");
                    return;
                }

                // Update only changed fields
                Object.keys(submitData).forEach(key => {
                    const currentValue = rows[rowIndex][key];
                    const newValue = submitData[key];
                    if (String(currentValue) !== String(newValue)) {
                        onUpdateRow(rowIndex, key, newValue);
                    }
                });

                toaster.create({
                    title: "Row Updated",
                    description: "Row has been updated successfully",
                    type: "success",
                    duration: 2000
                });
                onCancelEdit?.();
                resetForm();
            } else {
                // NEW ROW
                const capturedMiscTempId = miscDraftRowId || currentMiscData?.tempId;
                const capturedMiscData = currentMiscData;

                console.log("Submitting new row. Misc temp ID:", capturedMiscTempId);
                onAddRow(submitData);

                // Handle misc charges transfer if needed
                if (capturedMiscTempId && capturedMiscData && capturedMiscData.charges.length > 0) {
                    const checkForNewRow = (attempts = 0) => {
                        setTimeout(() => {
                            const latestRows = rowsRef.current;
                            const typeRows = latestRows.filter((r: any) => r.TRANSACTION_TYPE === transactionType);
                            const newRow = typeRows[typeRows.length - 1];

                            if (newRow && newRow.__rowId) {
                                const permanentId = newRow.__rowId;
                                console.log(`Found new row permanent ID: ${permanentId}`);

                                const allCharges = JSON.parse(localStorage.getItem("MISC_CHARGE_MASTER") || "[]");
                                const tempCharges = allCharges.filter((c: any) => c.draftRowId === capturedMiscTempId);

                                if (tempCharges.length > 0) {
                                    const withoutTemp = allCharges.filter((c: any) => c.draftRowId !== capturedMiscTempId);
                                    const updatedCharges = tempCharges.map((c: any) => ({ ...c, draftRowId: permanentId }));
                                    localStorage.setItem("MISC_CHARGE_MASTER", JSON.stringify([...withoutTemp, ...updatedCharges]));

                                    const total = updatedCharges.reduce((s: number, c: any) => s + c.amount, 0);
                                    const newRowIndex = latestRows.findIndex((r: any) => r.__rowId === permanentId);
                                    if (newRowIndex !== -1) {
                                        onUpdateRow(newRowIndex, "HMC", total.toFixed(2));
                                    }
                                    console.log(`Transferred ${tempCharges.length} misc charges to ${permanentId}`);
                                }
                            } else if (attempts < 5) {
                                checkForNewRow(attempts + 1);
                            } else {
                                console.error("Could not find new row after 5 attempts");
                            }
                        }, 100);
                    };
                    checkForNewRow();
                }

                resetForm();
            }

            pendingStoneData.current = null;
            pendingMiscData.current = null;

        } finally {
            setIsSubmitting(false);
        }
    }, [formData, calcNet, calcPure, validateForm, isIssue, onAddRow, onUpdateRow, onCancelEdit,
        currentEditingRowId, currentEditingTransactionType, transactionType, rows, miscDraftRowId,
        resetForm, getAvailableWeight, getAvailablePieces, toaster]);

    const handleEditRow = useCallback((row: any, tranType: string | undefined) => {
        const next: Record<string, any> = {};

        // Map form fields
        formFields.forEach(f => {
            if (f.type === "number" && row[f.key] !== undefined) {
                next[f.key] = row[f.key].toString();
            } else {
                next[f.key] = row[f.key] ?? f.defaultValue ?? "";
            }
        });

        // Stock availability check for editing
        if (isIssue && (row.PUREID || row.ITEMID)) {
            const stockId = tranType === "ISP" ? row.PUREID : row.ITEMID;

            if (stockId && getStockAvailability) {
                const availability = getStockAvailability(stockId, {
                    excludeRowId: row.__rowId,
                    isEditing: true,
                    originalWeight: tranType === "ISP" ? Number(row.WT) || 0 : Number(row.NETWT) || 0,
                    transactionTypeCode: tranType || "",
                });

                if (availability) {
                    // Store original values for stock calculation during update
                    if (tranType === "ISP") {
                        next._originalWeight = Number(row.WT) || 0;
                        next._pureId = row.PUREID;

                        toaster.create({
                            title: "Stock Info - ISP",
                            description: `Total: ${availability.weight.total.toFixed(3)}g | Used elsewhere: ${availability.weight.used.toFixed(3)}g | Available: ${availability.weight.remaining.toFixed(3)}g`,
                            type: "info",
                            duration: 4000,
                        });
                    } else if (tranType === "PR") {
                        next._originalPieces = Number(row.PCS) || 0;
                        next._originalNetwt = Number(row.NETWT) || 0;
                        next._itemId = row.ITEMID;

                        toaster.create({
                            title: "Stock Info - Item",
                            description: `Pieces: ${availability.pieces.remaining} available (Total: ${availability.pieces.total}, Used: ${availability.pieces.used}) | Net Wt: ${availability.weight.remaining.toFixed(3)}g available`,
                            type: "info",
                            duration: 5000,
                        });
                    }

                    // Store common stock info
                    next._availableStock = tranType === "ISP" ? availability.weight.remaining : availability.pieces.remaining;
                    next._totalStock = tranType === "ISP" ? availability.weight.total : availability.pieces.total;
                    next._stockAvailability = availability;
                }
            }
        }

        setFormData(next);
        setErrors({});
        setTouched({});
        onRowClick(row, tranType || "");
        pendingStoneData.current = null;
        setTimeout(() => focusIdx(0), 100);
    }, [formFields, focusIdx, onRowClick, isIssue, getStockAvailability, toaster]);

    const handleDeleteRow = useCallback((row: any) => {
        if (!window.confirm("Delete this row?")) return;
        onRemoveRow(row.__rowId);
        // 🔥 FIX: Use currentEditingRowId instead of editingRowId
        if (currentEditingRowId === row.__rowId) resetForm();
    }, [onRemoveRow, currentEditingRowId, resetForm]);

    const getCellValue = (col: any, row: any) => {
        const val = row[col.key];
        if (col.getLabelByValue && col.collection) return col.getLabelByValue(col.collection, val);
        if (col.key === "ITEMID" || col.key === "PUREID") {
            const items = itemsCollection?.items || [];
            const item = items.find((i: any) => i.value === val?.toString());
            return item?.label || val || "-";
        }
        if (val == null || val === "") return "-";
        if (col.decimalScale && Number(col.decimalScale) > 0) return Number(val || 0).toFixed(col.decimalScale);
        return val;
    };

    const formatTotal = (value: any, decimalScale?: number) => {
        if (value == null) return "";
        return Number(decimalScale) >= 1 ? Number(value).toFixed(decimalScale) : Number(value).toString();
    };

    const renderFormCell = (field: FormField) => {
        const ref = fieldRefs.current[field.key];
        const isInvalid = !!errors[field.key] && !!touched[field.key];
        const shouldDisable = field.disabled || (!!field.dependsOn && !formData[field.dependsOn]);


        if (field.key === "TAGNO") {
            return (
                <Box position="relative" width="100%">
                    <CapitalizedInput
                        field={field.key}
                        value={formData[field.key] || ""}
                        onChange={(_, v) => handleChange(field.key, v)}
                        type="text"
                        isCapitalized={true}
                        size="xs"
                        rounded="sm"
                        inputRef={ref}
                        // In renderFormCell TAGNO onEnter, after handleChange set ITEMID,
                        // add a small delay before moveNext so state has settled:

                        onKeyDown={() => {
                            const tagNo = formData.TAGNO?.trim();
                            if (!tagNo) { moveNext(field.key); return; }
                            setPendingTagNo(tagNo); // ✅ triggers hook → useEffect fills form
                        }}

                        noBorder
                    />
                </Box>
            );
        }


        if (field.key === "STNWT") {
            return (
                <Box position="relative" width="100%" onFocus={() => {
                    if (formData.GRSWT && Number(formData.GRSWT) > 0) {
                        handleOpenStoneModal(Number(formData.GRSWT));
                    } else {
                        toaster.create({ title: "Enter GRSWT first", type: "warning" });
                    }
                }}>
                    <CapitalizedInput
                        field={field.key}
                        value={formData[field.key] || ""}
                        onChange={(_, v) => handleChange(field.key, v)}
                        type="number"
                        isCapitalized={false}
                        size="xs"
                        rounded="sm"
                        decimalScale={field.decimalScale}
                        disabled={shouldDisable}
                        inputRef={ref}
                        onEnter={() =>
                            moveNext(field.key)}
                        noBorder
                    />
                    <Button
                        size="2xs" position="absolute" right="0" top="0" height="100%"
                        disabled={!formData.GRSWT || Number(formData.GRSWT) <= 0}
                        variant="ghost" minW="auto" px={0.5}
                    >💎</Button>
                </Box>
            );
        }

        if (field.key === "HMC") {
            return (
                <Box position="relative" width="100%" onFocus={handleOpenMiscModal}>
                    <CapitalizedInput
                        field={field.key} value={formData[field.key] || ""}
                        onChange={(_, v) => handleChange(field.key, v)}
                        type="number" isCapitalized={false}
                        size="xs"
                        rounded="sm"
                        decimalScale={2} inputRef={ref}
                        onEnter={() => moveNext(field.key)} noBorder
                    />
                    <Button
                        size="2xs" position="absolute" right="0" top="0" height="100%"
                        variant="ghost" minW="auto" px={0.5} title="Other Charges"

                    >📋</Button>
                </Box>
            );
        }

        if (field.key === "DESCRIPTION") {
            return (
                <Box position="relative" width="100%">
                    <CapitalizedInput
                        field={field.key}
                        value={formData[field.key] || ""}
                        onChange={(_, v) => handleChange(field.key, v)}
                        type="text"
                        isCapitalized
                        size="xs"
                        rounded="sm"
                        decimalScale={field.decimalScale}
                        disabled={shouldDisable}
                        inputRef={ref}
                        onEnter={() => handleSubmit()}
                        noBorder
                    />
                </Box>
            );
        }
        if (field.key === "ATOUCH") {
            return (
                <Box position="relative" width="100%">
                    <CapitalizedInput
                        field={field.key}
                        value={formData[field.key] || ""}
                        onChange={(_, v) => handleChange(field.key, v)}
                        type="text"
                        isCapitalized
                        size="xs"
                        rounded="sm"
                        decimalScale={field.decimalScale}
                        disabled={shouldDisable}
                        inputRef={ref}
                        onEnter={() => handleSubmit()}
                        noBorder
                    />
                </Box>
            );
        }

        if (field.key === "WT") {
            const availableStock = formData._availableStock;
            const originalWeight = formData._originalWeight;
            return (
                <Box position="relative" width="100%">
                    <CapitalizedInput
                        field={field.key}
                        value={formData[field.key] || ""}
                        onChange={(_, v) => handleChange(field.key, v)}
                        type="number"
                        isCapitalized={false}
                        size="xs"
                        rounded="sm"
                        decimalScale={field.decimalScale}
                        disabled={shouldDisable}
                        inputRef={ref}
                        onEnter={() => moveNext(field.key)}
                        noBorder
                    />
                    {availableStock && (
                        <Text
                            position="absolute" right="2px" top="0" fontSize="10px"
                            color={Number(formData.WT) > originalWeight ? "orange.500" : "green.500"}
                            pointerEvents="none"
                        >
                            {Number(formData.WT) > originalWeight ? "↑" : "↓"}
                        </Text>
                    )}
                </Box>
            );
        }

        switch (field.type) {
            case "combobox":
                return (
                    <SelectCombobox
                        value={formData[field.key] || ""}
                        onChange={(v) => { handleChange(field.key, v); if (v) moveNext(field.key); }}
                        items={field.collection?.items || []}
                        placeholder={field.placeholder || `Select ${field.label}`}
                        ref={ref as React.RefObject<HTMLInputElement>}
                        rounded="sm" 
                        disable={shouldDisable} 
                        onEnter={() => moveNext(field.key)}
                    />
                );
            case "select":
                return (
                    <InlineSelect
                        value={formData[field.key] || ""} 
                        onChange={v => handleChange(field.key, v)}
                        collection={field.collection} 
                        isInvalid={isInvalid}
                        inputRef={ref as any} 
                        onEnter={() => moveNext(field.key)} 
                        disabled={shouldDisable}
                    />
                );
            case "number":
                return (
                    <CapitalizedInput
                        field={field.key}
                        value={formData[field.key] || ""}
                        onChange={(_, v) => handleChange(field.key, v)}
                        type="number"
                        isCapitalized
                        size="sm"
                        rounded="sm"
                        inputRef={ref} 
                        onEnter={() => moveNext(field.key)}
                        disabled={shouldDisable}
                    />
                );
            case "capitalized":
                return (
                    <CapitalizedInput
                        field={field.key}
                        value={formData[field.key] || ""}
                        onChange={(_, v) => handleChange(field.key, v)}
                        type="text"
                        isCapitalized
                        size="sm"
                        rounded="sm"
                        inputRef={ref} 
                        onEnter={() => moveNext(field.key)}
                        disabled={shouldDisable}
                    />
                );
            default:
                return (
                    <CapitalizedInput
                        field={field.key} value={formData[field.key] || ""}
                        onChange={(_, v) => handleChange(field.key, v)}
                        type="number"  
                        size="sm" 
                        rounded="sm"
                        decimalScale={field.decimalScale} 
                        disabled={shouldDisable}
                        inputRef={ref} 
                        onEnter={() => moveNext(field.key)} 
                    />
                );
        }
    };

    const allDisplayCols = useMemo(() => [
        { key: "__sno", label: "", align: "center" as const },
        ...tableCols,
        { key: "__actions", label: "ACT", align: "center" as const },
    ], [tableCols]);

    const stripedBg = transactionType === "PU" ? "#EBF8FF"
        : transactionType === "PR" ? "#FFF5F5"
            : transactionType === "ISP" ? "#FFFAF0"
                : "#F7FAFC";

    const getCellStyle = (col: any, extra?: React.CSSProperties): React.CSSProperties => ({


        width: getWidth(col.width),
        minWidth: getWidth(col.width),
        maxWidth: getWidth(col.width),
        padding: "1px 3px",
        borderRight: "1px solid #E2E8F0",
        textAlign: col.align === "right" ? "right" : col.align === "center" ? "center" : "left",
        overflow: "hidden",
        boxSizing: "border-box",
        fontSize: "10px",
        ...extra,
    });

    useGlobalKey("Escape", () => setIsMiscModalOpen(false), "close-modal");
    console.log(transactionTitle,'transactionTitle')

    console.log(isTag,'isTag')

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            <Flex
                justifyContent="space-between" alignItems="center"
                px={2} py={1}
                bg={theme?.colors?.formColor || "#EDF2F7"}
                rounded="md" borderWidth="1px"
                borderColor={theme?.colors?.borderColor || "#CBD5E0"}
            >

                <HStack gap={2}>
                    <Text fontSize="xs" fontWeight="semibold" color={theme?.colors?.primaryText || "#1a202c"}>
                        {transactionTitle || "Transaction"} Items
                        {/* 🔥 FIX: Use isThisTableEditing to show editing indicator */}
                        {isThisTableEditing && (
                            <Text as="span" color="blue.500" ml={1} fontSize="2xs"> ✎ Editing</Text>
                        )}
                    </Text>
                    {transactionTitle?.toLowerCase() === "return" && 
                        <Button size="2xs" bg="yellow.fg" onClick={handleTagChange}>
                            Switch {isTag ? "Non Tag" : "Tag"}
                        </Button>
                    }
            
                    <Badge colorPalette={rows.length > 0 ? "green" : "gray"} variant="subtle" fontSize="2xs" px={2}>
                        {rows.length} item{rows.length !== 1 ? "s" : ""}
                    </Badge>
                </HStack>


                {!isEditing && (
                    <Button size="2xs" colorPalette="red" variant="outline"
                        onClick={() => { onClear?.(); resetForm(); }} fontSize="2xs">
                        <Icon as={LuX} boxSize={2} /> Clear All
                    </Button>
                )}
            </Flex>


            <TransactionTable
                theme={theme}
                tableCols={tableCols}
                formFields={formFields}
                rows={rows}
                formData={formData}
                errors={errors}
                touched={touched}
                // 🔥 FIX: Pass currentEditingRowId to TransactionTable
                localEditId={isThisTableEditing ? currentEditingRowId as string : null}
                isSubmitting={isSubmitting}
                totals={totals}
                stripedBg={stripedBg}
                allDisplayCols={allDisplayCols}
                isIssue={isIssue}
                resetForm={resetForm}
                handleSubmit={handleSubmit}
                handleEditRow={handleEditRow}
                handleDeleteRow={handleDeleteRow}
                renderFormCell={renderFormCell}
                getCellValue={getCellValue}
                formatTotal={formatTotal}
                getCellStyle={getCellStyle}
                transactionType={transactionType}
            />


            {/* MISC MODAL — uses miscDraftRowId only, never touches stoneDraftRowId */}
            {isMiscModalOpen && (
                <Box
                    position="fixed" top={0} left={0} right={0} bottom={0}
                    bg="rgba(0,0,0,0.5)" zIndex={100}
                    display="flex" alignItems="center" justifyContent="center"
                    onClick={() => {
                        setIsMiscModalOpen(false);
                        resetMiscTempId();
                        // Do NOT clear miscDraftRowId — keeps ID alive for re-open
                    }}
                >
                    <Box
                        bg={theme?.colors?.formColor || "white"} borderRadius="lg"
                        maxW="600px" width="100%" maxH="90vh" overflow="auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <OtherChargesWindow
                            draftRowId={miscDraftRowId}
                            onClose={closeOtherChargeModal}
                            onSave={(chargeRows) => {
                                if (!miscDraftRowId) return;

                                const allCharges = JSON.parse(localStorage.getItem("MISC_CHARGE_MASTER") || "[]");
                                const filtered = allCharges.filter((c: any) => c.draftRowId !== miscDraftRowId);
                                const updatedCharges = chargeRows.map(c => ({ ...c, draftRowId: miscDraftRowId }));
                                localStorage.setItem("MISC_CHARGE_MASTER", JSON.stringify([...filtered, ...updatedCharges]));

                                const total = updatedCharges.reduce((sum, c) => sum + (c.amount || 0), 0);
                                handleChange("HMC", total.toFixed(2));

                                // Always update pendingMiscData regardless of ID type
                                pendingMiscData.current = {
                                    tempId: miscDraftRowId,
                                    charges: updatedCharges,
                                    totalAmount: total
                                };

                                toaster.create({
                                    title: "Charges Updated",
                                    description: `Total charges: Rs.${total.toFixed(2)}`,
                                    type: "success",
                                    duration: 2000,
                                });

                                setIsMiscModalOpen(false);
                                resetMiscTempId();
                                // Do NOT clear miscDraftRowId after save

                                setTimeout(() => {
                                    const nextFieldIndex = visibleFormFields.findIndex(
                                        f => f.key === "HMC"
                                    ) + 1;
                                    if (nextFieldIndex < visibleFormFields.length) focusIdx(nextFieldIndex);
                                }, 50);
                            }}
                            chargeItems={otherChargesList}
                            otherChargesData={otherChargesData}
                        />
                    </Box>
                </Box>
            )}

            {/* STONE MODAL — uses stoneDraftRowId only, never touches miscDraftRowId */}
            {isStoneModalOpen && (
                <Box
                    position="fixed" top={0} left={0} right={0} bottom={0}
                    bg="rgba(0,0,0,0.5)" zIndex={100}
                    display="flex" alignItems="center" justifyContent="center"
                    onClick={() => setIsStoneModalOpen(false)}
                >
                    <Box
                        bg={theme?.colors?.formColor || "white"} borderRadius="lg"
                        maxW="1200px" width="100%" maxH="90vh" overflow="auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <StoneEnterMaster
                            grsWeight={currentGRSWT}
                            onClose={closeStoneModal}
                            draftRowId={stoneDraftRowId}
                            onSave={(stoneRows) => {
                                if (!stoneDraftRowId) return;

                                // Get existing stones from localStorage
                                const allStones = JSON.parse(localStorage.getItem("STONE_MASTER") || "[]");

                                // Remove stones for the current draft row
                                const filtered = allStones.filter((s: any) => s.draftRowId !== stoneDraftRowId);

                                // Attach draftRowId to new stones
                                const updatedStones = stoneRows.map(s => ({ ...s, draftRowId: stoneDraftRowId }));

                                // Save back to localStorage
                                localStorage.setItem("STONE_MASTER", JSON.stringify([...filtered, ...updatedStones]));

                                const stoneWtTotal = updatedStones.reduce((sum, r) => sum + r.stoneWeight, 0);
                                const stnAmtTotal = updatedStones.reduce((sum, r) => sum + r.stoneAmount, 0);

                                handleChange({
                                    STNWT: stoneWtTotal.toFixed(2),
                                    STNAMT: stnAmtTotal.toFixed(2),
                                });

                                // Store pending stone data if draftRowId is temporary
                                if (stoneDraftRowId.startsWith("stone-form-")) {
                                    pendingStoneData.current = {
                                        tempId: stoneDraftRowId,
                                        stones: updatedStones,
                                        totalWeight: stoneWtTotal,
                                    };
                                }

                                // Close modal and reset draft row
                                setIsStoneModalOpen(false);
                                setStoneDraftRowId("");

                                // Focus next input after short delay
                                setTimeout(() => focusIdx(5), 50);

                                console.log("Updated stones:", updatedStones, "Weight:", stoneWtTotal, "Amount:", stnAmtTotal);
                            }}
                            stoneItems={stoneItemsCollection}
                            subStoneItems={stoneItemsCollection}
                        />
                    </Box>
                </Box>
            )}
        </Box>
    );
}