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

import { issueColumns, purchaseColumns } from "../transactionForm/TransactionForm";

import { useStoneItems } from "@/hooks/apiHooks/item/useItems";
import { useCalculatePure } from "@/hooks/apiHooks/pure/useCalculatePure";

import StoneEnterMaster from "../StoneMaster/StoneEntryMaster";
import OtherChargesWindow from "../OtherCharges/OtherChargesWindow";

import { SelectCombobox } from "@/components/ui/selectComboBox";
import { useGlobalKey } from "@/components/key/useGlobalKey";
import TransactionTable from "@/component/table/TransactionTable";
import { toaster } from "@/components/ui/toaster";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";

import { getIsTagEnabled } from "@/config/transaction/PurchaseConfig";
import SalesBillViewModal from "../SaleModal/SaleModal";


// ─── Types ────────────────────────────────────────────────────────────────────

type StoneRow = {
    id: string;
    draftRowId: string;
    stoneId: string;
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
    allowFocus?: boolean;
}

interface DraftTransactionTableProps {
    rows: any[];
    editingState: { rowId: string | null; transactionType: string | null };
    // ✅ FIX 1: Added onEditRow — called for UPDATES (replaces field-by-field onUpdateRow in edit path)
    onEditRow: (rowId: string, submitData: any) => void;
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
    getAvailableWeight?: (
        id: string | number,
        options?: { excludeRowId?: string; isEditing?: boolean; originalWeight?: number; transactionTypeCode?: string }
    ) => number | null;
    onClear?: () => void;
    transactionType?: string;
    initialFormData?: any;
    getStockAvailability?: (
        id: string,
        options?: { excludeRowId?: string; transactionTypeCode: string; isEditing?: boolean; originalWeight?: number }
    ) => any | undefined;
    otherChargesList: { label: string; value: string }[];
    otherChargesData: any;
    getAvailablePieces?: (
        id: string,
        options?: { excludeRowId?: string; transactionTypeCode: string; isEditing?: boolean; originalPieces?: number }
    ) => any | undefined;
    handleTagChange: () => void;
    isTag: boolean;
    onTagNoLookup?: (tagNo: string) => void;
    acCode?: number;
    onSaleReturnModal: {
        billParams: { ACCODE: number | undefined; ENTRYNO?: string; BILLDATE?: string; TAGNO?: string };
        onBillParamChange: (field: string, value: any) => void;
        billDetails: any[] | [];
        loading: boolean;
        showBillModal: boolean;
        handleBillShow: () => void;
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getWidth = (width: string | number) => width || "30px";

function InlineSelect({
    value,
    onChange,
    collection,
    inputRef,
    onEnter,
    disabled,
    isInvalid,
}: {
    value: string;
    onChange: (v: string) => void;
    collection?: { items: { label: string; value: string }[] };
    isInvalid?: boolean;
    inputRef?: React.RefObject<HTMLSelectElement>;
    onEnter?: () => void;
    disabled?: boolean;
}) {
    const localRef = useRef<HTMLSelectElement>(null);
    const ref = (inputRef || localRef) as React.RefObject<HTMLSelectElement>;
    const safeItems = collection?.items || [];

    return (
        <select
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    onEnter?.();
                }
            }}
            disabled={disabled}
            style={{
                width: "100%",
                height: 22,
                fontSize: 10,
                borderRadius: 3,
                border: isInvalid ? "1px solid #FC8181" : "1px solid transparent",
                outline: "none",
                padding: "0 4px",
                background: disabled ? "#F7FAFC" : "white",
            }}
        >
            {safeItems.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DraftTransactionTable({
    rows,
    editingState,
    onEditRow,       // ✅ FIX 1: destructure new prop
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
    getStockAvailability,
    otherChargesList,
    otherChargesData,
    getAvailablePieces,
    isTag,
    handleTagChange,
    onTagNoLookup,
    acCode,
    onSaleReturnModal,
}: DraftTransactionTableProps) {


    // ── Editing state ──────────────────────────────────────────────────────────
    const currentEditingRowId = editingState?.rowId;
    const currentEditingTransactionType = editingState?.transactionType;
    const isThisTableEditing =
        currentEditingRowId !== null && currentEditingTransactionType === transactionType;

    // ── Modal / draft-ID state ─────────────────────────────────────────────────
    const [stoneDraftRowId, setStoneDraftRowId] = useState<string>("");
    const [miscDraftRowId, setMiscDraftRowId] = useState<string>("");

    const stoneModalOpenedRef = useRef(false);
    const miscModalOpenedRef = useRef(false);

    const stoneTempId = useRef<string | null>(null);
    const miscTempId = useRef<string | null>(null);

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

    // ── Stone / misc data pending refs ────────────────────────────────────────
    const pendingStoneData = useRef<{ tempId: string; stones: StoneRow[]; totalWeight: number } | null>(null);
    const pendingMiscData = useRef<{ tempId: string; charges: any[]; totalAmount: number } | null>(null);

    // ── Other refs & external data ────────────────────────────────────────────
    const rowsRef = useRef(rows);
    useEffect(() => { rowsRef.current = rows; }, [rows]);

    const { data: stoneItemsData } = useStoneItems({ STUDDED: "Y" });
    const [stoneItemsCollection, setStoneItemCollection] = useState<{ label: string; value: string }[]>([]);
    useEffect(() => {
        if (!stoneItemsData) return;
        setStoneItemCollection(
            stoneItemsData.map((item: any) => ({
                label: item.itemName,
                value: item.itemId.toString(),
            }))
        );
    }, [stoneItemsData]);

    const [tagNo, setTagNo] = useState<string>("");

    // ── Form state ────────────────────────────────────────────────────────────
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── Modal open state ──────────────────────────────────────────────────────
    const [isStoneModalOpen, setIsStoneModalOpen] = useState(false);
    const [isMiscModalOpen, setIsMiscModalOpen] = useState(false);
    const [currentGRSWT, setCurrentGRSWT] = useState<number>(0);

    // ── Refs for focus management ─────────────────────────────────────────────
    const fieldRefs = useRef<Record<string, React.RefObject<any>>>({});
    const submitBtnRef = useRef<HTMLButtonElement>(null);

    // ── Bill modal ────────────────────────────────────────────────────────────
    const { showBillModal, handleBillShow } = onSaleReturnModal;

    // ── Collections / column setup ────────────────────────────────────────────
    const wastypecollection = useMemo(
        () => ({ items: [{ label: "TOUCH", value: "TOUCH" }] }),
        []
    );

    const numericFields = useMemo(
        () => ["PCS", "GRSWT", "STNWT", "NETWT", "WASPER", "WASTAGE", "STNAMT",
            "PUREWT", "HMC", "MC", "WT", "TOUCH", "AWT", "APUREWT"],
        []
    );

    const orderedKeys = useMemo(() => {
        if (isIssue) return ["PUREID", "WT", "AWT", "TOUCH", "ATOUCH", "PUREWT", "APUREWT"];
        return isTag && transactionType === "PR"
            ? ["TAGNO", "ITEMID", "PCS", "GRSWT", "STNWT", "NETWT", "WASTYPE", "WASPER",
                "WASTAGE", "TOUCH", "PUREWT", "HMC", "MC", "STNAMT", "DESCRIPTION"]
            : ["ITEMID", "PCS", "GRSWT", "STNWT", "NETWT", "WASTYPE", "WASPER",
                "WASTAGE", "TOUCH", "PUREWT", "HMC", "MC", "STNAMT", "DESCRIPTION"];
    }, [isIssue, isTag]);

    const baseColumns = isIssue ? issueColumns : purchaseColumns(isTag);
    const colMap = useMemo(() => new Map(baseColumns.map((c) => [c.key, c])), [baseColumns]);
    const tableCols = useMemo(
        () => orderedKeys.map((k) => colMap.get(k)).filter(Boolean) as any[],
        [isIssue, colMap]
    );

    // ── Form fields definition ────────────────────────────────────────────────
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
                allowFocus: col.allowFocus,
                size: "xs",
                ...("decimalScale" in col && typeof col.decimalScale === "number"
                    ? { decimalScale: col.decimalScale }
                    : {}),
            };

            if (col.key === "ITEMID" || col.key === "PUREID")
                return { ...base, type: "combobox", collection: itemsCollection || { items: [] }, isRequired: true };

            if (col.key === "WASTYPE")
                return { ...base, type: "select", collection: wastypecollection, isRequired: true, dependsOn: "ITEMID", defaultValue: "TOUCH" };

            if (!isIssue && ["NETWT", "PUREWT"].includes(col.key))
                return { ...base, type: "calculated", disabled: true };

            if (isIssue && ["PUREWT", "APUREWT"].includes(col.key))
                return { ...base, type: "calculated", disabled: true };

            if (!isIssue && ["PCS", "GRSWT", "STNWT", "WASTYPE", "WASPER", "WASTAGE",
                "MC", "HMC", "TOUCH", "STNAMT", "DESCRIPTION"].includes(col.key)) {
                // ✅ When isTag, tag lookup fills these — no dependsOn lock needed
                return { ...base, dependsOn: isTag ? undefined : "ITEMID" };
            }

            if (isIssue && ["WT", "AWT", "TOUCH", "ATOUCH"].includes(col.key))
                return { ...base, dependsOn: "PUREID" };

            if (!isIssue && col.key === "STNAMT")
                return { ...base, type: "calculated", disabled: true };

            if (col.key === "TAGNO") {
                const isReturn = transactionTitle?.toLowerCase() === "return";
                return { ...base, type: "text", isRequired: isReturn && isTag, disabled: false };
            }

            return base;
        });
    }, [tableCols, itemsCollection, isIssue, isTag, transactionTitle]);

    // ── Visible fields (excludes auto-calculated display-only fields) ─────────
    const visibleFormFields = useMemo(
        () => formFields.filter(
            (f) => !["NETWT","STNAMT", "PUREWT", "APUREWT"].includes(f.key) && f.type !== "calculated"
        ),
        [formFields]
    );

    const formFieldsRef = useRef(formFields);
    useEffect(() => { formFieldsRef.current = formFields; }, [formFields]);

    const onRowClickRef = useRef(onRowClick);
    useEffect(() => { onRowClickRef.current = onRowClick; }, [onRowClick]);

    // ── Ensure refs exist for every visible field ──────────────────────────────
    useEffect(() => {
        visibleFormFields.forEach((f) => {
            if (!fieldRefs.current[f.key]) {
                fieldRefs.current[f.key] = React.createRef<any>();
            }
        });
    }, [visibleFormFields]);

    // ── Initialise from initialFormData prop ──────────────────────────────────
    useEffect(() => {
        if (!initialFormData) return;
        const next: Record<string, any> = {};
        formFieldsRef.current.forEach((f) => {
            if (f.type === "number" && initialFormData[f.key] !== undefined) {
                next[f.key] = initialFormData[f.key].toString();
            } else {
                next[f.key] = initialFormData[f.key] ?? f.defaultValue ?? "";
            }
        });
        setFormData(next);
        if (initialFormData.__rowId) {
            onRowClickRef.current(initialFormData, transactionType || "");
        }
    }, [initialFormData, transactionType]);

    // ── Blank form on mount ────────────────────────────────────────────────────
    useEffect(() => {
        const init: Record<string, any> = {};
        formFields.forEach((f) => { init[f.key] = f.defaultValue ?? ""; });
        setFormData(init);
    }, []); // empty — mount only



    // ── Populate form when editing an existing row ────────────────────────────
    useEffect(() => {
        if (currentEditingRowId && currentEditingTransactionType === transactionType) {
            const rowToEdit = rows.find((r) => r.__rowId === currentEditingRowId);
            console.log(rowToEdit,'rowToEdit')
            if (!rowToEdit) return;

            const next: Record<string, any> = {};
            formFieldsRef.current.forEach((f) => {
                if (f.type === "number" && rowToEdit[f.key] !== undefined) {
                    next[f.key] = rowToEdit[f.key].toString();
                } else {
                    next[f.key] = rowToEdit[f.key] ?? f.defaultValue ?? "";
                }
            });
            setFormData(next);

            // ✅ FIXED: Load stones from row's _stones array instead of localStorage
            const rowStones = rowToEdit._stones || [];
            console.log(rowStones,'rowStonesrowStones')
            if (rowStones.length > 0) {
                const totalStoneWeight = rowStones.reduce((sum: number, s: any) => {
                    return sum + Number(s.stoneWeight || 0);
                }, 0);
                if (totalStoneWeight > 0) {
                    setFormData((prev) => ({ ...prev, STNWT: totalStoneWeight.toFixed(3) }));
                }
                pendingStoneData.current = {
                    tempId: currentEditingRowId as string,
                    stones: rowStones,
                    totalWeight: totalStoneWeight,
                };
                setStoneDraftRowId(currentEditingRowId as string);
            }

            // ── Restore misc charges from row's _miscCharges array ────────────
            const rowCharges = rowToEdit._miscCharges || [];
            if (rowCharges.length > 0) {
                const totalMiscAmount = rowCharges.reduce(
                    (sum: number, c: any) => sum + (c.amount || 0),
                    0
                );
                setFormData((prev) => ({ ...prev, HMC: totalMiscAmount.toFixed(2) }));
                pendingMiscData.current = {
                    tempId: currentEditingRowId as string,
                    charges: rowCharges,
                    totalAmount: totalMiscAmount,
                };
                setMiscDraftRowId(currentEditingRowId as string);
            }

            setErrors({});
            setTouched({});
        }
    }, [currentEditingRowId, currentEditingTransactionType, transactionType, rows]);

    // ── Derived / calculated values ───────────────────────────────────────────
    const pureValue = useCalculatePure(formData.WT, formData.TOUCH);
    const altPureValue = useCalculatePure(formData.AWT, formData.ATOUCH);

    // Keep NETWT / PUREWT in sync whenever GRSWT / STNWT / TOUCH change
    useEffect(() => {
        const g = parseFloat(formData.GRSWT) || 0;
        const s = parseFloat(formData.STNWT) || 0;
        const t = parseFloat(formData.TOUCH) || 0;
        const netwt = (g - s).toFixed(3);
        const purewt = ((g - s) * t / 100).toFixed(3);
        setFormData((prev) => {
            if (prev.NETWT === netwt && prev.PUREWT === purewt) return prev;
            return { ...prev, NETWT: netwt, PUREWT: purewt };
        });
    }, [formData.GRSWT, formData.STNWT, formData.TOUCH]);

    useEffect(() => {
        if (pureValue) setFormData((p) => ({ ...p, PUREWT: pureValue }));
        if (altPureValue) setFormData((p) => ({ ...p, APUREWT: altPureValue }));
    }, [pureValue, altPureValue]);

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

    // ── handleChange ──────────────────────────────────────────────────────────
    type FormData = typeof formData;

    const handleChange = useCallback(
        (keyOrObject: string | Partial<FormData>, value?: any) => {
            let next = { ...formData };

            if (typeof keyOrObject === "string") {
                next[keyOrObject] = value;
                // Mirror WT → AWT and TOUCH → ATOUCH
                if (keyOrObject === "WT") next.AWT = value;
                if (keyOrObject === "TOUCH") next.ATOUCH = value;
            } else {
                next = { ...next, ...keyOrObject };
                if ("WT" in keyOrObject) next.AWT = keyOrObject.WT;
                if ("TOUCH" in keyOrObject) next.ATOUCH = keyOrObject.TOUCH;
            }

            const wt = parseFloat(next.WT || 0);
            const awt = parseFloat(next.AWT || 0);
            const atouch = parseFloat(next.ATOUCH || 0);
            const g = parseFloat(next.GRSWT || 0);
            const s = parseFloat(next.STNWT || 0);
            const touch = parseFloat(next.TOUCH || 0);

            next.NETWT = (g - s).toFixed(3);
            next.PUREWT = isIssue ? (wt * touch / 100).toFixed(3) : ((g - s) * touch / 100).toFixed(3);
            next.APUREWT = (awt * atouch / 100).toFixed(3);

            setFormData(next);

            if (typeof keyOrObject === "string") {
                setTouched((p) => ({ ...p, [keyOrObject]: true }));
                setErrors((p) => ({ ...p, [keyOrObject]: "" }));
            } else {
                Object.keys(keyOrObject).forEach((k) => {
                    setTouched((p) => ({ ...p, [k]: true }));
                    setErrors((p) => ({ ...p, [k]: "" }));
                });
            }
        },
        [formData, isIssue]
    );

    // ── Focus helpers ─────────────────────────────────────────────────────────
    const focusIdx = useCallback(
        (idx: number) => {
            const f = visibleFormFields[idx];
            if (!f) return;
            const ref = fieldRefs.current[f.key];
            setTimeout(() => { ref?.current?.focus?.(); ref?.current?.select?.(); }, 60);
        },
        [visibleFormFields]
    );

  
    const moveNext = useCallback(
        (key: string) => {
            const idx = visibleFormFields.findIndex((f) => f.key === key);
            let next = idx + 1;
            // Only skip fields that are hard-disabled (calculated, explicitly disabled prop)
            while (next < visibleFormFields.length && visibleFormFields[next].disabled === true) {
                next++;
            }
            if (next < visibleFormFields.length) focusIdx(next);
            else submitBtnRef.current?.click();
        },
        [visibleFormFields, focusIdx]
    );

    // ── Validation ────────────────────────────────────────────────────────────
    const validateForm = useCallback((): boolean => {
        const errs: Record<string, string> = {};
        let valid = true;
        visibleFormFields.forEach((f) => {
            const val = formData[f.key];
            if (f.isRequired && (!val || val.toString().trim() === "")) {
                errs[f.key] = `${f.label} is required`;
                valid = false;
            }
        });
        const allTouched: Record<string, boolean> = {};
        visibleFormFields.forEach((f) => { allTouched[f.key] = true; });
        setTouched(allTouched);
        setErrors(errs);
        if (!valid) {
            const firstErr = visibleFormFields.find((f) => errs[f.key]);
            if (firstErr) {
                focusIdx(visibleFormFields.findIndex((f) => f.key === firstErr.key));
                toaster.create({ title: "Validation Error", description: errs[firstErr.key], type: "error" });
            }
        }
        return valid;
    }, [visibleFormFields, formData, focusIdx]);

    // ── Reset form ────────────────────────────────────────────────────────────
    const resetForm = useCallback(() => {
        onCancelEdit?.();
        const reset: Record<string, any> = {};
        formFields.forEach((f) => { reset[f.key] = f.defaultValue ?? ""; });
        setFormData(reset);
        setErrors({});
        setTouched({});
        resetStoneTempId();
        resetMiscTempId();
        setStoneDraftRowId("");
        setMiscDraftRowId("");
        focusIdx(0);
    }, [formFields, focusIdx]);

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = useCallback(async () => {
        if (!validateForm()) return;

        // ── Basic value validation ─────────────────────────────────────────
        if (transactionType === "ISP" && Number(formData.WT) <= 0) {
            toaster.create({ title: "Invalid Weight", description: "Weight must be greater than 0", type: "error" });
            return;
        }
        if (transactionType === "PU") {
            if (Number(formData.PCS) <= 0) {
                toaster.create({ title: "Invalid Pieces", description: "Pieces must be greater than 0", type: "error" });
                return;
            }
            if (Number(formData.NETWT) <= 0) {
                toaster.create({ title: "Invalid Net Weight", description: "Net weight must be greater than 0", type: "error" });
                return;
            }
        }

        // ── Stock availability check ───────────────────────────────────────
        const stockId = transactionType === "ISP" ? formData.PUREID : formData.ITEMID;
        if (stockId) {
            const isEditMode = !!(currentEditingRowId && currentEditingTransactionType === transactionType);

            if (transactionType === "PU") {
                const availablePieces = getAvailablePieces?.(stockId, {
                    excludeRowId: isEditMode ? (currentEditingRowId as string) : undefined,
                    isEditing: isEditMode,
                    originalPieces: isEditMode ? Number(formData._originalPieces) || 0 : 0,
                    transactionTypeCode: transactionType,
                }) ?? null;

                if (availablePieces !== null && Number(formData.PCS) > availablePieces) {
                    toaster.create({
                        title: "Insufficient Stock",
                        description: `Requested pieces ${formData.PCS} exceeds available stock ${availablePieces}`,
                        type: "error",
                    });
                    return;
                }

                const availableWeight = getAvailableWeight?.(stockId, {
                    excludeRowId: isEditMode ? (currentEditingRowId as string) : undefined,
                    isEditing: isEditMode,
                    originalWeight: isEditMode ? Number(formData._originalNetwt) || 0 : 0,
                    transactionTypeCode: transactionType,
                }) ?? null;

                if (availableWeight !== null && Number(formData.NETWT) > availableWeight) {
                    toaster.create({
                        title: "Insufficient Stock",
                        description: `Requested net weight ${Number(formData.NETWT).toFixed(3)}g exceeds available ${availableWeight.toFixed(3)}g`,
                        type: "error",
                    });
                    return;
                }
            }

            if (transactionType === "ISP") {
                const requestedWeight = Number(formData.WT) || 0;
                const originalWeight = isEditMode ? Number(formData._originalWeight) || 0 : 0;
                const availableWeight = getAvailableWeight?.(stockId, {
                    excludeRowId: isEditMode ? (currentEditingRowId as string) : undefined,
                    isEditing: isEditMode,
                    originalWeight,
                    transactionTypeCode: transactionType,
                }) ?? null;

              

                if (availableWeight !== null && requestedWeight > availableWeight) {
                    toaster.create({
                        title: "Insufficient Stock",
                        description: `Requested weight ${requestedWeight.toFixed(3)}g exceeds available ${availableWeight.toFixed(3)}g`,
                        type: "error",
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

            if (currentEditingRowId && currentEditingTransactionType === transactionType) {
                onEditRow(currentEditingRowId as string, submitData);
                toaster.create({ title: "Row Updated", type: "success", duration: 2000 });
                resetForm();
                return;
            }

            // NEW ROW - No localStorage needed
            onAddRow(submitData);
            resetForm();
        } finally {
            pendingStoneData.current = null;
            pendingMiscData.current = null;
            setIsSubmitting(false);
        }
    }, [
        formData, calcNet, calcPure, validateForm, isIssue, pureValue,
        onAddRow, onEditRow, currentEditingRowId, currentEditingTransactionType,
        transactionType, resetForm, getAvailableWeight, getAvailablePieces,
    ]);

    // ── Edit row handler (called from table row click) ────────────────────────
    const handleEditRow = useCallback(
        (row: any, tranType: string | undefined) => {
            const next: Record<string, any> = {};
            formFields.forEach((f) => {
                if (f.type === "number" && row[f.key] !== undefined) {
                    next[f.key] = row[f.key].toString();
                } else {
                    next[f.key] = row[f.key] ?? f.defaultValue ?? "";
                }
            });

            if (isIssue && (row.PUREID || row.ITEMID)) {
                const stockId = tranType === "ISP" ? row.PUREID : row.ITEMID;
                if (stockId && getStockAvailability) {
                    const availability = getStockAvailability(stockId, {
                        excludeRowId: row.__rowId,
                        isEditing: true,
                        originalWeight: tranType === "ISP" ? Number(row.WT) || 0 : Number(row.NETWT) || 0,
                        transactionTypeCode: tranType || "",
                    });
                    console.log(availability, 'availabilityintable')
                    if (availability) {
                        if (tranType === "ISP") {
                            next._originalWeight = Number(row.WT) || 0;
                            next._pureId = row.PUREID;
                            toaster.create({
                                title: "Stock Info - ISP",
                                description: `Total: ${availability.weight.total.toFixed(3)}g | Used: ${availability.weight.used.toFixed(3)}g | Available: ${availability.weight.remaining.toFixed(3)}g`,
                                type: "info", duration: 4000,
                            });
                        } else if (tranType === "PU") {
                            next._originalPieces = Number(row.PCS) || 0;
                            next._originalNetwt = Number(row.NETWT) || 0;
                            next._itemId = row.ITEMID;
                            toaster.create({
                                title: "Stock Info - Item",
                                description: `Pieces: ${availability.pieces.remaining} avail | Net Wt: ${availability.weight.remaining.toFixed(3)}g avail`,
                                type: "info", duration: 5000,
                            });
                        }
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
        },
        [formFields, focusIdx, onRowClick, isIssue, getStockAvailability]
    );

    // ── Delete row ────────────────────────────────────────────────────────────
    const handleDeleteRow = useCallback(
        (row: any) => {
            if (!window.confirm("Delete this row?")) return;
            onRemoveRow(row.__rowId);
            if (currentEditingRowId === row.__rowId) resetForm();
        },
        [onRemoveRow, currentEditingRowId, resetForm]
    );

    // ── Stone modal ───────────────────────────────────────────────────────────

    const handleOpenStoneModal = (grsWeight: number) => {
        if (stoneModalOpenedRef.current) return;
        stoneModalOpenedRef.current = true;
        setCurrentGRSWT(grsWeight);

        if (currentEditingRowId) {
            // Editing existing row — use its permanent rowId
            setStoneDraftRowId(currentEditingRowId as string);
        } else if (stoneDraftRowId) {
            // Already assigned (e.g. from tag lookup) — keep it, just re-set to force render
            setStoneDraftRowId(stoneDraftRowId);
        } else {
            // Brand-new entry — generate a fresh temp ID
            setStoneDraftRowId(getStoneTempId());
        }

        setTimeout(() => setIsStoneModalOpen(true), 50);
        setTimeout(() => { stoneModalOpenedRef.current = false; }, 500);
    };

    const closeStoneModal = () => {
        setIsStoneModalOpen(false);
        // Do NOT clear stoneDraftRowId here — resetForm() handles it
    };

    // ── Misc / other-charges modal ────────────────────────────────────────────
    const handleOpenMiscModal = () => {
        if (miscModalOpenedRef.current) return;
        miscModalOpenedRef.current = true;

        let idToUse: string;

        if (currentEditingRowId) {
            idToUse = currentEditingRowId as string;
            const row = rows.find((r: any) => r.__rowId === idToUse);
            console.log(row , 'rowsfor the misc')
            const rowCharges = row?._miscCharges || [];
            if (rowCharges.length > 0) {
                const total = rowCharges.reduce((sum: number, c: any) => sum + c.amount, 0);
                pendingMiscData.current = { tempId: idToUse, charges: rowCharges, totalAmount: total };
                handleChange("HMC", total.toFixed(2));
            }
        } else if (miscDraftRowId) {
            idToUse = miscDraftRowId;
            // Check pending data first
            if (pendingMiscData.current?.tempId === idToUse) {
                const total = pendingMiscData.current.totalAmount;
                handleChange("HMC", total.toFixed(2));
            } else {
                // Check row data
                const row = rows.find((r: any) => r.__rowId === idToUse);
                console.log(row, 'rowsfor the misc')
                const rowCharges = row?._miscCharges || [];
                if (rowCharges.length > 0) {
                    const total = rowCharges.reduce((sum: number, c: any) => sum + c.amount, 0);
                    pendingMiscData.current = { tempId: idToUse, charges: rowCharges, totalAmount: total };
                    handleChange("HMC", total.toFixed(2));
                }
            }
        } else {
            idToUse = getMiscTempId();
        }

        setMiscDraftRowId(idToUse);
        setIsMiscModalOpen(true);
        setTimeout(() => { miscModalOpenedRef.current = false; }, 500);
    };

    const closeOtherChargeModal = () => {
        setIsMiscModalOpen(false);
        resetMiscTempId();
    };

    // ── Tag lookup ────────────────────────────────────────────────────────────
    const handleTagNoKeyDown = async () => {
        if (!tagNo) return;
        try {
            await onTagNoLookup?.(tagNo);
            setTagNo("");
        } catch (error) {
            console.error("Tag lookup failed:", error);
            toaster.create({ title: "Error", description: "Failed to process tag", type: "error" });
        }
    };
    console.log(pendingStoneData,'pendingStoneData')

    // ── Stone modal initial rows ───────────────────────────────────────────────
    const stoneModalInitialRows = useMemo(() => {
        if (!stoneDraftRowId) return [];

        // First check pending data
        if (pendingStoneData.current?.tempId === stoneDraftRowId) {
            return pendingStoneData.current.stones;
        }

        // Then check the actual row data
        const row = rows.find((r: any) => r.__rowId === stoneDraftRowId);
        if (row?._stones) {
            return row._stones;
        }

        return [];
    }, [stoneDraftRowId, isStoneModalOpen, rows]);

    // ── Other Charges initial rows ───────────────────────────────────────────────
    const otherChargesInitialRows = useMemo(() => {
        if (!miscDraftRowId) return [];

        // First check pending data
        if (pendingMiscData.current?.tempId === miscDraftRowId) {
            return pendingMiscData.current.charges;
        }

        // Then check the actual row data
        const row = rows.find((r: any) => r.__rowId === miscDraftRowId);
        if (row?._miscCharges) {
            return row._miscCharges;
        }

        return [];
    }, [miscDraftRowId, isMiscModalOpen, rows]);
    // ── Cell rendering ────────────────────────────────────────────────────────
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

    // ── Form cell renderer ────────────────────────────────────────────────────
    const renderFormCell = (field: FormField) => {
        const ref = fieldRefs.current[field.key];
        const isInvalid = !!errors[field.key] && !!touched[field.key];
        const shouldDisable = field.disabled || (!!field.dependsOn && !formData[field.dependsOn]) ;

        if (field.key === "TAGNO") {
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
                        inputRef={ref}
                        noBorder
                        disabled
                    />
                </Box>
            );
        }


        if (field.key === "STNWT") {
            return (
                <Box
                    position="relative" width="100%"
                    onFocus={() => {
                        if (formData.GRSWT && Number(formData.GRSWT) > 0) {
                            handleOpenStoneModal(Number(formData.GRSWT));
                        } else {
                            toaster.create({ title: "Enter GRSWT first", type: "warning" });
                        }
                    }}
                >
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
                        field={field.key}
                        value={formData[field.key] || ""}
                        onChange={(_, v) => handleChange(field.key, v)}
                        type="number"
                        isCapitalized={false}
                        size="xs"
                        rounded="sm"
                        decimalScale={2}
                        inputRef={ref}
                        onEnter={() => moveNext(field.key)}
                        noBorder
                    />
                    <Button
                        size="2xs" position="absolute" right="0" top="0" height="100%"
                        variant="ghost" minW="auto" px={0.5} title="Other Charges"
                    >📋</Button>
                </Box>
            );
        }
        if(field.key === "STNAMT"){
            return (
                <CapitalizedInput 
                    field={field.key}
                    value={formData[field.key] || ""}
                    onEnter={() => moveNext(field.key)}
                    onChange={(_, v) => handleChange(field.key, v)}
                    type="number"
                    decimalScale={2}
                    allowFocus
                    disabled
                />
            )
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
                        onChange={(v) => handleChange(field.key, v)}
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
                        field={field.key}
                        value={formData[field.key] || ""}
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

    // ── Display columns ───────────────────────────────────────────────────────
    const allDisplayCols = useMemo(
        () => [
            { key: "__sno", label: "", align: "center" as const },
            ...tableCols,
            { key: "__actions", label: "ACT", align: "center" as const },
        ],
        [tableCols]
    );

    const stripedBg =
        transactionType === "SA" ? "#EBF8FF"
            : transactionType === "SR" ? "#FFF5F5"
                : transactionType === "IS" ? "#FFFAF0"
                    : "#F7FAFC";

    const TYPE_COLORS: Record<string, { bg: string; active: string; text: string }> = {
        PU: { bg: "#b7fff1", active: "#2F855A", text: "#1C4532" },
        PR: { bg: "#ffc4c4", active: "#C53030", text: "#742A2A" },
        ISP: { bg: "#ffd9a4", active: "#DD6B20", text: "#7B341E" },
        REC: { bg: "#ffcafb", active: "#c729ba", text: "#8f1084" },
    };

    const showTag = getIsTagEnabled(transactionType);

    useGlobalKey("Escape", () => setIsMiscModalOpen(false), "close-modal");

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <Box display="flex" flexDirection="column" gap={0}>
            {/* ── Header bar ─────────────────────────────────────────────── */}
            <Flex
                justifyContent="space-between"
                alignItems="center"
                px={2} py={1}
                bg="#FFF" color="#222"
                rounded="md" borderWidth="1px"
                borderColor={theme?.colors?.borderColor || "#CBD5E0"}
            >
                <HStack gap={2}>
                    <Text fontSize="xs" fontWeight="semibold" color={theme?.colors?.primaryText || "#1a202c"}>
                        {transactionTitle || "Transaction"} Items
                        {isThisTableEditing && (
                            <Text as="span" color="blue.500" ml={1} fontSize="2xs"> ✎ Editing</Text>
                        )}
                    </Text>

                    {showTag && (
                        <>
                            <Button size="2xs" bg="yellow.subtle" color="blackAlpha.800" onClick={handleTagChange}>
                                Switch to {isTag ? "NonTag" : "Tag"}
                            </Button>
                            {isTag && (
                                <Box display="flex" alignItems="center">
                                    <CapitalizedInput
                                        field="tagNo"
                                        value={tagNo}
                                        onChange={(_, value) => setTagNo(value)}
                                        size="xs"
                                        onEnter={handleTagNoKeyDown}
                                    />
                                </Box>
                            )}
                        </>
                    )}

                  

                    <Badge
                        colorPalette={rows.length > 0 ? "green" : "gray"}
                        variant="subtle" fontSize="2xs" px={2}
                    >
                        {rows.length} item{rows.length !== 1 ? "s" : ""}
                    </Badge>
                </HStack>

                {!isEditing && (
                    <Button
                        size="2xs" colorPalette="red" variant="outline" fontSize="2xs"
                        onClick={() => { onClear?.(); resetForm(); }}
                    >
                        <Icon as={LuX} boxSize={2} /> Clear All
                    </Button>
                )}
            </Flex>

            {/* ── Main table ─────────────────────────────────────────────── */}
            <TransactionTable
                theme={theme}
                tableCols={tableCols}
                formFields={formFields}
                rows={rows}
                formData={formData}
                errors={errors}
                touched={touched}
                localEditId={isThisTableEditing ? (currentEditingRowId as string) : null}
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
                formBackground={TYPE_COLORS[transactionType ?? ""]?.bg || "#FFF"}
            />

            {/* ── Misc / Other-charges modal ──────────────────────────────── */}
            {isMiscModalOpen && (
                <Box
                    position="fixed" top={0} left={0} right={0} bottom={0}
                    bg="rgba(0,0,0,0.5)" zIndex={100}
                    display="flex" alignItems="center" justifyContent="center"
                    onClick={() => { setIsMiscModalOpen(false); resetMiscTempId(); }}
                >
                    <Box
                        bg={theme?.colors?.formColor || "white"} borderRadius="lg"
                        maxW="600px" width="100%" maxH="90vh" overflow="auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <OtherChargesWindow
                            draftRowId={miscDraftRowId}
                            onClose={closeOtherChargeModal}
                            initialRows={otherChargesInitialRows}
                            onSave={(chargeRows) => {
                                if (!miscDraftRowId) return;

                                const updatedCharges = chargeRows.map((c) => ({ ...c, draftRowId: miscDraftRowId }));
                                const total = updatedCharges.reduce((sum, c) => sum + (c.amount || 0), 0);

                                handleChange("HMC", total.toFixed(2));
                                pendingMiscData.current = {
                                    tempId: miscDraftRowId,
                                    charges: updatedCharges,
                                    totalAmount: total,
                                };

                                toaster.create({
                                    title: "Charges Updated",
                                    description: `Total charges: Rs.${total.toFixed(2)}`,
                                    type: "success", duration: 2000,
                                });

                                setIsMiscModalOpen(false);
                                resetMiscTempId();

                                setTimeout(() => {
                                    const nextIdx = visibleFormFields.findIndex((f) => f.key === "HMC") + 1;
                                    if (nextIdx < visibleFormFields.length) focusIdx(nextIdx);
                                }, 50);
                            }}
                            chargeItems={otherChargesList}
                            otherChargesData={otherChargesData}
                        />
                    </Box>
                </Box>
            )}

            {/* ── Stone modal ─────────────────────────────────────────────── */}
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
                        onClick={(e) => e.stopPropagation()}
                    >
                        <StoneEnterMaster
                            grsWeight={currentGRSWT}
                            onClose={closeStoneModal}
                            draftRowId={stoneDraftRowId}
                            initialRows={stoneModalInitialRows}
                            onSave={(stoneRows) => {
                                if (!stoneDraftRowId) return;

                                const updatedStones = stoneRows.map((s) => ({ ...s, draftRowId: stoneDraftRowId }));
                                const stoneWtTotal = updatedStones.reduce((sum, r) => sum + r.stoneWeight, 0);
                                const stnAmtTotal = updatedStones.reduce((sum, r) => sum + r.stoneAmount, 0);

                                handleChange({
                                    STNWT: stoneWtTotal.toFixed(3),
                                    STNAMT: stnAmtTotal.toFixed(2),
                                });

                                pendingStoneData.current = {
                                    tempId: stoneDraftRowId,
                                    stones: updatedStones,
                                    totalWeight: stoneWtTotal,
                                };

                                setIsStoneModalOpen(false);
                                setTimeout(() => focusIdx(5), 50);
                            }}
                            stoneItems={stoneItemsCollection}
                        />

                    </Box>
                </Box>
            )}

            {/* ── Sales bill modal ────────────────────────────────────────── */}
            {/* <SalesBillViewModal
                isOpen={showBillModal}
                onClose={handleBillShow}
                billParams={onSaleReturnModal.billParams}
                onBillParamChange={onSaleReturnModal.onBillParamChange}
                billDetails={onSaleReturnModal.billDetails}
                loading={onSaleReturnModal.loading}
            /> */}
        </Box>
    );
}