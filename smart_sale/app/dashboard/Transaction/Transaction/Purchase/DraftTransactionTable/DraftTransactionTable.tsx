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
import { LuX, LuPencil, LuTrash2 } from "react-icons/lu";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";
import { issueColumns, issueDataColumns } from "../../Issue/isseColumns";
import { useCalculatePure } from "@/hooks/pure/useCalculatePure";
import { toaster } from "@/components/ui/toaster";
import StoneEnterMaster from "../StoneMaster/StoneEntryMaster";
import TransactionTable from "@/component/table/TransactionTable";
import { useStoneItems } from "@/hooks/item/useItems";
import { SelectCombobox } from "@/components/ui/selectComboBox";

/* ─── TYPES ─── */
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
    editingRowId: string | number | null;
    onAddRow: (formData?: any) => void;
    onUpdateRow: (rowIndex: number, field: string, value: any) => void;
    onRemoveRow: (rowId: string) => void;
    onRowClick: (row: any) => void;
    onCancelEdit: (rowId?: string) => void;
    onSaveRow: (row: any, isNew: boolean) => void;
    itemsCollection: any;
    totals: any;
    transactionTitle: string | undefined;
    theme: any;
    itemsFilter: any;
    handleClearForm?: any;
    isEditing: boolean;
    isIssue?: boolean;
    getAvailableWeight?: (id: string | number) => number | null;
    onClear?: () => void;
    transactionType?: string;
}

/* ─── COLUMN WIDTHS ─── */
const COL_WIDTHS: Record<string, string> = {
    __sno: "26px", ITEMID: "120px", PUREID: "120px",
    PCS: "30px", GRSWT: "52px", STNWT: "52px", NETWT: "52px",
    WASTYPE: "52px", WASPER: "40px", WASTAGE: "48px",
    TOUCH: "44px", PUREWT: "52px", MC: "40px", ATOUCH: "44px",
    DESCRIPTION: "80px", WT: "52px", AWT: "52px",
    PURE: "52px", APURE: "52px", __actions: "54px",
};
const getWidth = (key: string) => COL_WIDTHS[key] || "48px";


/* ─── INLINE SELECT ─── */
function InlineSelect({
    value, onChange, collection, placeholder, inputRef, onEnter, disabled, isInvalid,
}: {
    value: string; onChange: (v: string) => void;
    collection?: { items: { label: string; value: string }[] };
    placeholder?: string; isInvalid?: boolean;
    inputRef?: React.RefObject<HTMLSelectElement>;
    onEnter?: () => void; disabled?: boolean;
}) {
    const localRef = useRef<HTMLSelectElement>(null);
    const ref = (inputRef || localRef) as React.RefObject<HTMLSelectElement>;

    // Safe default for collection items
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
            {/* {placeholder && <option value="">{placeholder}</option>} */}
            {safeItems.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    );
}

/* ════════════════════════════════════════════
   MAIN
════════════════════════════════════════════ */
export default function DraftTransactionTable({
    rows, editingRowId, onAddRow, onUpdateRow, onRemoveRow, onRowClick,
    onCancelEdit, onSaveRow, itemsCollection, totals, transactionTitle,
    theme, itemsFilter, handleClearForm, isEditing, isIssue,
    getAvailableWeight, onClear, transactionType,
}: DraftTransactionTableProps) {


    const { data: stoneItemsData } = useStoneItems();

    const [stoneItemsCollection, setStoneItemCollection] = useState<
        { label: string; value: string }[]
    >([]);

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
    const [localEditId, setLocalEditId] = useState<string | null>(null);
    const [isStoneModalOpen, setIsStoneModalOpen] = useState(false);
    const [currentGRSWT, setCurrentGRSWT] = useState<number>(0);

    const fieldRefs = useRef<Record<string, React.RefObject<any>>>({});
    const submitBtnRef = useRef<HTMLButtonElement>(null);

    const wastypecollection = { items: [{ label: "TOUCH", value: "TOUCH" }] };
    const numericFields = [
        "PCS", "GRSWT", "STNWT", "NETWT", "WASPER", "WASTAGE", "ATOUCH",
        "PUREWT", "MC", "WT", "AWT", "TOUCH", "PURE", "APURE",
    ];

    const orderedKeys = isIssue
        ? ["PUREID", "WT", "AWT", "TOUCH", "ATOUCH", "PURE", "APURE"]
        : ["ITEMID", "PCS", "GRSWT", "STNWT", "NETWT", "WASTYPE", "WASPER", "WASTAGE", "TOUCH", "PUREWT", "MC", "ATOUCH", "DESCRIPTION"];

    const baseColumns = isIssue ? issueDataColumns : issueColumns;
    const colMap = useMemo(() => new Map(baseColumns.map(c => [c.key, c])), [baseColumns]);
    const tableCols = useMemo(() =>
        orderedKeys.map(k => colMap.get(k)).filter(Boolean) as any[],
        [isIssue, colMap]
    );

    /* ─── form field definitions ─── */
    const formFields = useMemo<FormField[]>(() => {
        return tableCols.map((col): FormField => {
            const isNum = numericFields.includes(col.key);
            const isRequired = isIssue
                ? ["PUREID", "TOUCH", "WT"].includes(col.key)
                : ["ITEMID", "PCS", "GRSWT", "TOUCH"].includes(col.key);

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

            // ITEMID / PUREID — combobox
            if (col.key === "ITEMID" || col.key === "PUREID") {
                return {
                    ...base,
                    type: "combobox",
                    // Only pass collection if it exists, otherwise pass empty collection
                    collection: itemsCollection || {items:[]},
                    isRequired: true
                };
            }

            if (col.key === "ITEMCODE" || col.key === "HSNCODE")
                return { ...base, type: "capitalized" };

            if (col.key === "WASTYPE")
                return { ...base, type: "select", collection: wastypecollection, isRequired: true, dependsOn: "ITEMID", defaultValue: "TOUCH" };

            if (!isIssue && ["NETWT", "PUREWT"].includes(col.key))
                return { ...base, type: "calculated", disabled: true };

            if (isIssue && ["PURE", "APURE"].includes(col.key))
                return { ...base, type: "calculated", disabled: true };

            if (!isIssue && ["PCS", "GRSWT", "STNWT", "WASTYPE", "WASPER", "WASTAGE", "MC", "TOUCH", "ATOUCH", "DESCRIPTION"].includes(col.key))
                return { ...base, dependsOn: "ITEMID" };

            if (isIssue && ["WT", "AWT", "TOUCH", "ATOUCH"].includes(col.key))
                return { ...base, dependsOn: "PUREID" };

            return base;
        });
    }, [tableCols, itemsCollection, isIssue]); // Keep itemsCollection in deps but with fallback

    const visibleFormFields = useMemo(() =>
        formFields.filter(f => !["NETWT", "PUREWT", "PURE", "APURE"].includes(f.key) && f.type !== "calculated"),
        [formFields]
    );

    // Initialize refs for visible fields
    useEffect(() => {
        visibleFormFields.forEach(f => {
            if (!fieldRefs.current[f.key]) {
                fieldRefs.current[f.key] = React.createRef<any>();
            }
        });
    }, [visibleFormFields]);

    /* ─── calculations ─── */
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

    /* init */
    useEffect(() => {
        const init: Record<string, any> = {};
        formFields.forEach(f => { init[f.key] = f.defaultValue ?? ""; });
        setFormData(init);
    }, [formFields]);

    /* ─── change ─── */
    const handleChange = useCallback((key: string, value: any) => {
        const mirror: Record<string, string> = { WT: "AWT", TOUCH: "ATOUCH" };
        const next = { ...formData, [key]: value };
        if (mirror[key]) next[mirror[key]] = value;

        if ((key === "WT" || key === "AWT") && formData.PUREID && getAvailableWeight) {
            const avail = getAvailableWeight(formData.PUREID);
            if (avail != null && Number(value) > avail) {
                toaster.create({ title: "Stock Limit Exceeded", description: `Available: ${avail}`, type: "error" });
                next[key] = avail;
            }
        }
        if (key === "GRSWT" || key === "STNWT") {
            const g = parseFloat(key === "GRSWT" ? value : formData.GRSWT) || 0;
            const s = parseFloat(key === "STNWT" ? value : formData.STNWT) || 0;
            next.NETWT = (g - s).toFixed(3);
            if (formData.TOUCH) next.PUREWT = ((g - s) * (parseFloat(formData.TOUCH) || 0) / 100).toFixed(3);
        }
        if (key === "TOUCH") {
            const n = parseFloat(formData.NETWT || calcNet()) || 0;
            next.PUREWT = ((n * (parseFloat(value) || 0)) / 100).toFixed(3);
        }
        setFormData(next);
        setTouched(p => ({ ...p, [key]: true }));
        setErrors(p => ({ ...p, [key]: "" }));
    }, [formData, calcNet, getAvailableWeight]);

    /* ─── navigation ─── */
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


    /* ─── validation ─── */
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
                toaster.create({
                    title: "Validation Error",
                    description: errs[firstErrField.key],
                    type: "error",
                });
            }
        }
        return valid;
    }, [visibleFormFields, formData, focusIdx]);

    /* ─── reset ─── */
    const resetForm = useCallback(() => {
        const reset: Record<string, any> = {};
        formFields.forEach(f => { reset[f.key] = f.defaultValue ?? ""; });
        setFormData(reset);
        setErrors({}); setTouched({}); setLocalEditId(null);
        setTimeout(() => focusIdx(0), 100);
    }, [formFields, focusIdx]);

    /* ─── submit — ADD or UPDATE ─── */
    const handleSubmit = useCallback(async () => {
        if (!validateForm()) return;
        setIsSubmitting(true);
        try {
            const isUpdate = !!localEditId;
            const existingRow = rows.find(r => r.__rowId === localEditId);
            const submitData = {
                ...formData,
                NETWT: calcNet(),
                PUREWT: calcPure(),
                WASTYPE: formData.WASTYPE || "TOUCH",
                __rowId: localEditId ?? `row-${Date.now()}`,
                __isNew: !isUpdate,
                __previewSno: isUpdate
                    ? existingRow?.__previewSno
                    : rows.length + 1,
                ...(isUpdate && existingRow?.TRANSACTION_TYPE
                    ? { TRANSACTION_TYPE: existingRow.TRANSACTION_TYPE }
                    : {}),
            };
            onAddRow(submitData);
            resetForm();
        } finally { setIsSubmitting(false); }
    }, [formData, calcNet, calcPure, localEditId, rows, onAddRow, validateForm, resetForm]);

    /* ─── edit row → populate form ─── */
    const handleEditRow = useCallback((row: any) => {
        const next: Record<string, any> = {};
        formFields.forEach(f => { next[f.key] = row[f.key] ?? f.defaultValue ?? ""; });
        setFormData(next); setErrors({}); setTouched({});
        setLocalEditId(row.__rowId);
        setTimeout(() => focusIdx(0), 100);
    }, [formFields, focusIdx]);

    /* ─── delete ─── */
    const handleDeleteRow = useCallback((row: any) => {
        if (!window.confirm("Delete this row?")) return;
        onRemoveRow(row.__rowId);
        if (localEditId === row.__rowId) resetForm();
    }, [onRemoveRow, localEditId, resetForm]);

    /* ─── display value ─── */
    const getCellValue = (col: any, row: any) => {
        const val = row[col.key];
        if (col.getLabelByValue && col.collection) return col.getLabelByValue(col.collection, val);
        if (col.key === "ITEMID" || col.key === "PUREID") {
            // Safe access to itemsCollection
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

    /* ─── render one input cell ─── */
    const renderFormCell = (field: FormField) => {
        const ref = fieldRefs.current[field.key];
        const isInvalid = !!errors[field.key] && !!touched[field.key];
        const shouldDisable =
            field.disabled ||
            (!!field.dependsOn && !formData[field.dependsOn]);

        if (field.key === "STNWT") {
            return (
                <Box position="relative" width="100%" onFocus={() => {
                    if (formData.GRSWT && Number(formData.GRSWT) > 0) {
                        setCurrentGRSWT(Number(formData.GRSWT));
                        setIsStoneModalOpen(true);
                    } else toaster.create({ title: "Enter GRSWT first", type: "warning" });
                }}>
                    <CapitalizedInput
                        field={field.key} value={formData[field.key] || ""}
                        onChange={(_, v) => handleChange(field.key, v)}
                        type="number" isCapitalized={false} size="xs" onClassUse rounded="sm"
                        decimalScale={field.decimalScale} disabled={shouldDisable}
                        inputRef={ref} onEnter={() => moveNext(field.key)} noBorder
                    />
                    <Button
                        size="2xs" position="absolute" right="0" top="0" height="100%"
                        disabled={!formData.GRSWT || Number(formData.GRSWT) <= 0}
                        variant="ghost" minW="auto" px={0.5}
                    >💎</Button>
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
                        type="number"
                        isCapitalized={false}
                        size="xs"
                        onClassUse
                        rounded="sm"
                        decimalScale={field.decimalScale}
                        disabled={shouldDisable}
                        inputRef={ref}
                        onEnter={() => handleSubmit()} // <-- save row
                        noBorder
                    />
                </Box>
            );
        }
        switch (field.type) {
            case "combobox":
                return (
                    <SelectCombobox
                        value={formData[field.key] || ""}
                        onChange={(v) => {
                            handleChange(field.key, v);  // update formData first
                            if (v) moveNext(field.key);  // move next only if a value is selected
                        }}
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
                        placeholder={field.placeholder}
                        isInvalid={isInvalid}
                        inputRef={ref as any}
                        onEnter={() => moveNext(field.key)}
                        disabled={shouldDisable}
                        
                    />
                );
            case "capitalized":
                return (
                    <CapitalizedInput
                        field={field.key} value={formData[field.key] || ""}
                        onChange={(_, v) => handleChange(field.key, v)}
                        type="text" isCapitalized size="xs" rounded="sm"
                        inputRef={ref} onEnter={() => moveNext(field.key)} disabled={shouldDisable}
                        noBorder
                    />
                );
            default:
                return (
                    <CapitalizedInput
                        field={field.key} value={formData[field.key] || ""}
                        onChange={(_, v) => handleChange(field.key, v)}
                        type="number" isCapitalized={false} size="xs" onClassUse rounded="sm"
                        decimalScale={field.decimalScale} disabled={shouldDisable}
                        inputRef={ref} onEnter={() => moveNext(field.key)} noBorder
                    />
                );
        }
    };

    const allDisplayCols = useMemo(() => [
        { key: "__sno", label: "#", align: "center" as const },
        ...tableCols,
        { key: "__actions", label: "ACT", align: "center" as const },
    ], [tableCols]);

    const stripedBg = transactionType === "PU" ? "#EBF8FF"
        : transactionType === "PR" ? "#FFF5F5"
            : transactionType === "ISP" ? "#FFFAF0"
                : "#F7FAFC";

    const getCellStyle = (col: any, extra?: React.CSSProperties): React.CSSProperties => ({
        width: getWidth(col.key),
        minWidth: getWidth(col.key),
        maxWidth: getWidth(col.key),
        padding: "1px 3px",
        borderRight: "1px solid #E2E8F0",
        textAlign: col.align === "right" ? "right" : col.align === "center" ? "center" : "left",
        overflow: "hidden",
        boxSizing: "border-box",
        fontSize: "10px",
        ...extra,
    });


    /* ════════ RENDER ════════ */
    return (
        <Box display="flex" flexDirection="column" gap={1}>
            {/* top bar */}
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
                        {localEditId && (
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

            {/* unified table */}
            {!isEditing && (
                <TransactionTable
                    theme={theme}
                    tableCols={tableCols}
                    formFields={formFields}
                    rows={rows}
                    formData={formData}
                    errors={errors}
                    touched={touched}
                    localEditId={localEditId}
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
                />
            )}

            {/* stone modal */}
            {isStoneModalOpen && (
                <Box position="fixed" top={0} left={0} right={0} bottom={0}
                    bg="rgba(0,0,0,0.5)" zIndex={100}
                    display="flex" alignItems="center" justifyContent="center"
                    onClick={() => setIsStoneModalOpen(false)}>
                    <Box bg={theme?.colors?.formColor || "white"} borderRadius="lg"
                        maxW="1200px" width="100%" maxH="90vh" overflow="auto"
                        onClick={e => e.stopPropagation()}>
                        <StoneEnterMaster
                            netWeight={currentGRSWT}
                            onClose={() => setIsStoneModalOpen(false)}
                            onSave={stoneData => {
                                const total = stoneData.reduce((sum, r) => sum + (r.stoneUnit === "c" ? r.stoneWeight / 5 : r.stoneWeight), 0);
                                handleChange("STNWT", total.toFixed(3));
                                setIsStoneModalOpen(false);
                                setTimeout(() => focusIdx(5), 50); // focus first field after closing modal
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