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
import { CapitalizedInput } from "@/component/form/CapitalizedInput";
import { issueColumns, issueDataColumns } from "../../Issue/isseColumns";
import { useCalculatePure } from "@/hooks/pure/useCalculatePure";
import { toaster } from "@/components/ui/toaster";
import StoneEnterMaster from "../StoneMaster/StoneEntryMaster";
import TransactionTable from "@/component/table/TransactionTable";
import { useStoneItems } from "@/hooks/item/useItems";
import { SelectCombobox } from "@/components/ui/selectComboBox";
import OtherChargesWindow from "../OtherCharges/OtherChargesWindow";

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
    getAvailableWeight?: (id: string | number) => number | null;
    onClear?: () => void;
    transactionType?: string;
    initialFormData?: any;
    onFormDataChange?: (data: any) => void;
    getStockAvailability?: (id: string, rowId?: string) => { remaining: number; used: number; total: number } | undefined;
    otherChargesList: { label: string; value: string; }[];
    otherChargesData: any;
}

// const COL_WIDTHS: Record<string, string> = {
//     __sno: "26px", ITEMID: "120px", PUREID: "110px",
//     PCS: "25px", GRSWT: "40px", STNWT: "52px",HMC:"52px", NETWT: "40px",
//     WASTYPE: "52px", WASPER: "30px", WASTAGE: "35px",
//     TOUCH: "35px", PUREWT: "40px", MC: "40px", ATOUCH: "44px",
//     DESCRIPTION: "80px",


//     WT: "60px", AWT: "60px",
//     PURE: "60px", APURE: "60px", __actions: "60px",
// };

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
    otherChargesData
}: DraftTransactionTableProps) {

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
    const rowsRef = useRef(rows);
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

    const wastypecollection = { items: [{ label: "TOUCH", value: "TOUCH" }] };
    const numericFields = [
        "PCS", "GRSWT", "STNWT", "NETWT", "WASPER", "WASTAGE", "STNAMT", "ATOUCH",
        "PUREWT", "HMC", "MC", "WT", "AWT", "TOUCH", "PURE", "APURE",
    ];

    const orderedKeys = isIssue
        ? ["PUREID", "WT", "AWT", "TOUCH", "ATOUCH", "PURE", "APURE"]
        : ["ITEMID", "PCS", "GRSWT", "STNWT", "NETWT", "WASTYPE", "WASPER", "WASTAGE", "TOUCH", "PUREWT", "HMC", "MC", "STNAMT", "DESCRIPTION"];

    const baseColumns = isIssue ? issueDataColumns : issueColumns;
    const colMap = useMemo(() => new Map(baseColumns.map(c => [c.key, c])), [baseColumns]);
    const tableCols = useMemo(() =>
        orderedKeys.map(k => colMap.get(k)).filter(Boolean) as any[],
        [isIssue, colMap]
    );

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

            if (col.key === "ITEMCODE" || col.key === "HSNCODE")
                return { ...base, type: "capitalized" };

            if (col.key === "WASTYPE")
                return { ...base, type: "select", collection: wastypecollection, isRequired: true, dependsOn: "ITEMID", defaultValue: "TOUCH" };

            if (!isIssue && ["NETWT", "PUREWT"].includes(col.key))
                return { ...base, type: "calculated", disabled: true };

            if (isIssue && ["PURE", "APURE"].includes(col.key))
                return { ...base, type: "calculated", disabled: true };

            if (!isIssue && ["PCS", "GRSWT", "STNWT", "WASTYPE", "WASPER", "WASTAGE", "MC", "HMC", "TOUCH", "STNAMT", "DESCRIPTION"].includes(col.key))
                return { ...base, dependsOn: "ITEMID" };


            if (isIssue && ["WT", "AWT", "TOUCH", "ATOUCH"].includes(col.key))
                return { ...base, dependsOn: "PUREID" };


            return base;
        });
    }, [tableCols, itemsCollection, isIssue]);

    const visibleFormFields = useMemo(() =>
        formFields.filter(f => !["NETWT", "PUREWT", "PURE", "APURE"].includes(f.key) && f.type !== "calculated"),
        [formFields]
    );

    useEffect(() => {
        if (initialFormData) {
            const next: Record<string, any> = {};
            formFields.forEach(f => {
                if (f.type === "number" && initialFormData[f.key] !== undefined) {
                    next[f.key] = initialFormData[f.key].toString();
                } else {
                    next[f.key] = initialFormData[f.key] ?? f.defaultValue ?? "";
                }
            });
            setFormData(next);
            if (initialFormData.__rowId) {
                onRowClick(initialFormData, transactionType || "");
            }
        }
    }, [initialFormData, formFields, onRowClick, transactionType]);

    useEffect(() => {
        visibleFormFields.forEach(f => {
            if (!fieldRefs.current[f.key]) {
                fieldRefs.current[f.key] = React.createRef<any>();
            }
        });
    }, [visibleFormFields]);

    const pureValue = useCalculatePure(formData.WT, formData.TOUCH);
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
        setFormData(p => ({ ...p, NETWT: calcNet() }));
    }, [formData.GRSWT, formData.STNWT, calcNet]);

    useEffect(() => {
        setFormData(p => ({ ...p, PUREWT: calcPure() }));
    }, [formData.GRSWT, formData.STNWT, formData.TOUCH, calcPure]);

    useEffect(() => {
        if (pureValue) setFormData(p => ({ ...p, PURE: pureValue }));
        if (altPureValue) setFormData(p => ({ ...p, APURE: altPureValue }));
    }, [pureValue, altPureValue]);

    useEffect(() => {
        const init: Record<string, any> = {};
        formFields.forEach(f => { init[f.key] = f.defaultValue ?? ""; });
        setFormData(init);
    }, [formFields]);

    // 🔥 FIX: Populate form + load stones/misc when currentEditingRowId changes
    useEffect(() => {
        if (currentEditingRowId && currentEditingTransactionType === transactionType) {
            const rowToEdit = rows.find(r => r.__rowId === currentEditingRowId);
            if (rowToEdit) {
                const next: Record<string, any> = {};
                formFields.forEach(f => {
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
        } else {
            const init: Record<string, any> = {};
            formFields.forEach(f => { init[f.key] = f.defaultValue ?? ""; });
            setFormData(init);
            setErrors({});
            setTouched({});
            // Reset both IDs independently when editing is cancelled
            setStoneDraftRowId("");
            setMiscDraftRowId("");
        }
    }, [currentEditingRowId, currentEditingTransactionType, transactionType, rows, formFields]);

    type FormData = typeof formData;

    const handleChange = useCallback(
        (keyOrObject: string | Partial<FormData>, value?: any) => {
            let next = { ...formData };

            if (typeof keyOrObject === "string") {
                next[keyOrObject] = value;
            } else {
                next = { ...next, ...keyOrObject };
            }

            // Mirror logic
            const mirror: Record<string, string> = { WT: "AWT", TOUCH: "ATOUCH" };
            Object.keys(next).forEach(k => {
                if (mirror[k]) next[mirror[k]] = next[k];
            });

            // Recalculate NETWT / PUREWT if relevant
            const g = parseFloat(next.GRSWT || 0);
            const s = parseFloat(next.STNWT || 0);
            next.NETWT = (g - s).toFixed(3);
            const touch = parseFloat(next.TOUCH || 0);
            next.PUREWT = ((g - s) * touch / 100).toFixed(3);

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
        [formData]
    );

    const focusIdx = useCallback((idx: number) => {
        const f = visibleFormFields[idx];
        if (!f) return;
        const ref = fieldRefs.current[f.key];
        setTimeout(() => { ref?.current?.focus?.(); ref?.current?.select?.(); }, 60);
    }, [visibleFormFields]);

    const moveNext = useCallback((key: string) => {
        const idx = visibleFormFields.findIndex(f => f.key === key);
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
    }, [formFields]);

    const handleSubmit = useCallback(async () => {
        if (!validateForm()) return;

        if (isIssue) {
            if (Number(formData.WT) <= 0) {
                toaster.create({ title: "Invalid Weight", description: "Weight must be greater than 0", type: "error" });
                return;
            }
        } else {
            if (Number(formData.GRSWT) <= 0) {
                toaster.create({ title: "Invalid Gross Weight", description: "Gross weight must be greater than 0", type: "error" });
                return;
            }
            if (Number(formData.TOUCH) <= 0) {
                toaster.create({ title: "Invalid Touch", description: "Touch must be greater than 0", type: "error" });
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const submitData: any = {
                ...formData,
                NETWT: calcNet(),
                PUREWT: calcPure(),
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

            // 🔥 FIX: Use currentEditingRowId instead of editingRowId
            if (currentEditingRowId && currentEditingTransactionType === transactionType) {
                const rowIndex = rows.findIndex(r => r.__rowId === currentEditingRowId);
                if (rowIndex === -1) { console.error("Row not found for update"); return; }

                Object.keys(submitData).forEach(key => {
                    const currentValue = rows[rowIndex][key];
                    const newValue = submitData[key];
                    if (String(currentValue) !== String(newValue)) {
                        onUpdateRow(rowIndex, key, newValue);
                    }
                });

                toaster.create({ title: "Row Updated", description: "Row has been updated successfully", type: "success", duration: 2000 });
                onCancelEdit?.();
                resetForm();
            } else {
                // NEW ROW — use miscDraftRowId (never touched by stone modal)
                const capturedMiscTempId = miscDraftRowId || currentMiscData?.tempId;
                const capturedMiscData = currentMiscData;

                console.log("Submitting new row. Misc temp ID:", capturedMiscTempId);
                onAddRow(submitData);

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
    }, [formData, calcNet, calcPure, validateForm, isIssue, onAddRow, onUpdateRow, onCancelEdit, currentEditingRowId, currentEditingTransactionType, transactionType, rows, miscDraftRowId, resetForm]);

    const handleEditRow = useCallback((row: any, tranType: string | undefined) => {

        const next: Record<string, any> = {};
        formFields.forEach(f => {
            if (f.type === "number" && row[f.key] !== undefined) {
                next[f.key] = row[f.key].toString();
            } else {
                next[f.key] = row[f.key] ?? f.defaultValue ?? "";
            }
        });

        if (isIssue && row.PUREID) {
            const availability = getStockAvailability ? getStockAvailability(row.PUREID, row.__rowId) : undefined;
            if (availability) {
                next._availableStock = availability.remaining;
                next._totalStock = availability.total;
                next._originalWeight = Number(row.WT) || 0;
                next._pureId = row.PUREID;
                toaster.create({
                    title: "Stock Info",
                    description: `Total: ${availability.total.toFixed(3)}g | Used elsewhere: ${availability.used.toFixed(3)}g | Available: ${availability.remaining.toFixed(3)}g`,
                    type: "info",
                    duration: 4000,
                });
            }
        }

        setFormData(next);
        setErrors({});
        setTouched({});
        // Pass transaction type here
        onRowClick(row, tranType || "");
        pendingStoneData.current = null;
        setTimeout(() => focusIdx(0), 100);
    }, [formFields, focusIdx, onRowClick, transactionType, isIssue, getStockAvailability]);



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

        console.log(formData,'formDataformData')

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

        if (field.key === "DESCRIPTION" || field.key === "ATOUCH") {
            return (
                <Box position="relative" width="100%">
                    <CapitalizedInput
                        field={field.key} value={formData[field.key] || ""}
                        onChange={(_, v) => handleChange(field.key, v)}
                        type="number" isCapitalized={false} size="xs" rounded="sm"
                        decimalScale={field.decimalScale} disabled={shouldDisable}
                        inputRef={ref} onEnter={() => handleSubmit()} noBorder
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
                        rounded="sm" disable={shouldDisable} onEnter={() => moveNext(field.key)}
                    />
                );
            case "select":
                return (
                    <InlineSelect
                        value={formData[field.key] || ""} onChange={v => handleChange(field.key, v)}
                        collection={field.collection} isInvalid={isInvalid}
                        inputRef={ref as any} onEnter={() => moveNext(field.key)} disabled={shouldDisable}
                    />
                );
            case "number":
                return (
                    <CapitalizedInput
                        field={field.key}
                        value={formData[field.key] || ""}
                        onChange={(_, v) => handleChange(field.key, v)}
                        type="text"
                        isCapitalized
                        size="sm"
                        rounded="sm"
                        inputRef={ref} onEnter={() => moveNext(field.key)}
                        disabled={shouldDisable} noBorder
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
                        inputRef={ref} onEnter={() => moveNext(field.key)}
                        disabled={shouldDisable} noBorder
                    />
                );
            default:
                return (
                    <CapitalizedInput
                        field={field.key} value={formData[field.key] || ""}
                        onChange={(_, v) => handleChange(field.key, v)}
                        type="number" isCapitalized={false} size="sm" rounded="sm"
                        decimalScale={field.decimalScale} disabled={shouldDisable}
                        inputRef={ref} onEnter={() => moveNext(field.key)} noBorder

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
                        maxW="500px" width="100%" maxH="90vh" overflow="auto"
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