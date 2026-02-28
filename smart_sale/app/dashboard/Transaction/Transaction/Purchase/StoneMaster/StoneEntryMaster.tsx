"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    Box,
    Text,
    NativeSelect,
    Button,
    HStack,
    IconButton,
} from "@chakra-ui/react";
import { LuX } from "react-icons/lu";
import { CapitalizedInput } from "@/component/form/CapitalizedInput";
import { SelectCombobox, SelectItem } from "@/components/ui/selectComboBox";
import TransactionTable from "@/component/table/TransactionTable";
import { toaster } from "@/components/ui/toaster";

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

type Props = {
    draftRowId: string;
    grsWeight?: number;
    onClose: () => void;
    onSave: (rows: StoneRow[]) => void;
    initialRows?: StoneRow[];
    stoneItems?: SelectItem[];
    subStoneItems?: SelectItem[];
};

const COL_WIDTHS: Record<string, string> = {
    __sno: "40px",
    stoneId: "100px",
    subStoneId: "100px",
    stonePcs: "60px",
    stoneWeight: "80px",
    stoneUnit: "60px",
    stoneCalculation: "60px",
    stoneRate: "80px",
    stoneAmount: "100px",
    __actions: "100px",
};

const getWidth = (key: string) => COL_WIDTHS[key] || "80px";

const getCellStyle = (col: any, extra?: React.CSSProperties): React.CSSProperties => ({
    width: getWidth(col.key),
    minWidth: getWidth(col.key),
    maxWidth: getWidth(col.key),
    padding: "4px 6px",
    borderRight: "1px solid #E2E8F0",
    textAlign: col.align === "right" ? "right" : col.align === "center" ? "center" : "left",
    overflow: "hidden",
    boxSizing: "border-box",
    fontSize: "12px",
    ...extra,
});

// Field order for focus traversal (excludes stoneAmount - it's calculated/readonly)
const FIELD_ORDER = [
    "stoneId", "subStoneId", "stonePcs", "stoneWeight",
    "stoneUnit", "stoneCalculation", "stoneRate",
] as const;

type FieldKey = typeof FIELD_ORDER[number];

export default function StoneEnterMaster({
    grsWeight = 0,
    onClose,
    onSave,
    initialRows = [],
    stoneItems = [],
    subStoneItems = [],
    draftRowId
}: Props) {

    const tableCols = [
        { key: "stoneId", label: "STONE", align: "left" as const },
        { key: "subStoneId", label: "SUB STONE", align: "left" as const },
        { key: "stonePcs", label: "PCS", align: "right" as const, decimalScale: 0 },
        { key: "stoneWeight", label: "WEIGHT", align: "right" as const, decimalScale: 3 },
        { key: "stoneUnit", label: "UNIT", align: "center" as const },
        { key: "stoneCalculation", label: "CALCULATION", align: "center" as const },
        { key: "stoneRate", label: "RATE", align: "right" as const, decimalScale: 2 },
        { key: "stoneAmount", label: "AMOUNT", align: "right" as const, decimalScale: 2 },
    ];

    const allDisplayCols = [
        { key: "__sno", label: "#", align: "center" as const },
        ...tableCols,
        { key: "__actions", label: "Action", align: "center" as const },
    ];

    const emptyForm = {
        stoneId: "",
        subStoneId: "",
        stonePcs: "",
        stoneWeight: "",
        stoneUnit: "g" as "g" | "c",
        stoneCalculation: "w" as "w" | "p",
        stoneRate: "",
        stoneAmount: 0,
    };

    const [formData, setFormData] = useState<{
        stoneId: string;
        subStoneId: string;
        stonePcs: string;
        stoneWeight: string;
        stoneUnit: "g" | "c";
        stoneCalculation: "w" | "p";
        stoneRate: string;
        stoneAmount: number;
    }>(emptyForm);

    const [rows, setRows] = useState<StoneRow[]>([]);
    const [editId, setEditId] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isSubmitting] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const hasLoadedRef = useRef(false);

    const stoneIdRef = useRef<any>(null);
    const subStoneIdRef = useRef<any>(null);
    const stonePcsRef = useRef<HTMLInputElement>(null);
    const stoneWeightRef = useRef<HTMLInputElement>(null);
    const stoneUnitRef = useRef<HTMLSelectElement>(null);
    const stoneCalculationRef = useRef<HTMLSelectElement>(null);
    const stoneRateRef = useRef<HTMLInputElement>(null);

    const fieldRefs: Record<FieldKey, React.RefObject<any>> = {
        stoneId: stoneIdRef,
        subStoneId: subStoneIdRef,
        stonePcs: stonePcsRef,
        stoneWeight: stoneWeightRef,
        stoneUnit: stoneUnitRef,
        stoneCalculation: stoneCalculationRef,
        stoneRate: stoneRateRef,
    };

    /* ---------------- LOAD FROM LOCALSTORAGE ---------------- */
    useEffect(() => {
        if (!draftRowId) return;

        if (hasLoadedRef.current && rows.length > 0) {
            console.log(`Already loaded stones for ${draftRowId}, skipping...`);
            return;
        }

        const all: StoneRow[] = JSON.parse(localStorage.getItem("STONE_MASTER") || "[]");
        const linked = all.filter(s => s.draftRowId === draftRowId);
        const nonEmptyRows = linked.filter(s =>
            s.stoneId && s.stoneId !== "" &&
            s.stonePcs > 0 && s.stoneWeight > 0 && s.stoneRate > 0
        );

        if (nonEmptyRows.length > 0) {
            setRows(nonEmptyRows);
            const filtered = all.filter(s =>
                s.draftRowId !== draftRowId ||
                (s.stoneId && s.stoneId !== "" && s.stonePcs > 0 && s.stoneWeight > 0 && s.stoneRate > 0)
            );
            localStorage.setItem("STONE_MASTER", JSON.stringify(filtered));
        }

        setIsInitialized(true);
        hasLoadedRef.current = true;

        setTimeout(() => { stoneIdRef.current?.focus?.(); }, 100);

        return () => {
            setTimeout(() => { hasLoadedRef.current = false; }, 300);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draftRowId]);

    /* ---------------- ESC KEY — own effect, always active ---------------- */
    useEffect(() => {
        const handleEscKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }
        };
        window.addEventListener("keydown", handleEscKey);
        return () => window.removeEventListener("keydown", handleEscKey);
    }, [onClose]);

    /* ---------------- AUTO CALCULATE AMOUNT ---------------- */
    useEffect(() => {
        setFormData(prev => ({ ...prev, stoneAmount: calculateAmount(prev) }));
    }, [formData.stoneWeight, formData.stonePcs, formData.stoneRate, formData.stoneUnit, formData.stoneCalculation]);

    /* ---------------- SAVE TO LOCALSTORAGE ---------------- */
    useEffect(() => {
        if (!isInitialized || !draftRowId) return;
        saveStonesToStorage();
    }, [rows, draftRowId, isInitialized]);

    const saveStonesToStorage = () => {
        const all: StoneRow[] = JSON.parse(localStorage.getItem("STONE_MASTER") || "[]");
        const filtered = all.filter(s => s.draftRowId !== draftRowId);
        const nonEmptyRows = rows.filter(s =>
            s.stoneId && s.stoneId !== "" && s.stonePcs > 0 && s.stoneWeight > 0 && s.stoneRate > 0
        );
        localStorage.setItem("STONE_MASTER", JSON.stringify([...filtered, ...nonEmptyRows]));
    };

    /* ---------------- FORM FIELDS ---------------- */
    const formFields = [
        { key: "stoneId", label: "Stone", type: "combobox" as const, isRequired: true, collection: { items: stoneItems }, ref: stoneIdRef },
        { key: "subStoneId", label: "Sub Stone", type: "combobox" as const, isRequired: true, collection: { items: subStoneItems }, ref: subStoneIdRef },
        { key: "stonePcs", label: "Pcs", type: "number" as const, isRequired: true, decimalScale: 0, ref: stonePcsRef },
        { key: "stoneWeight", label: "Weight", type: "number" as const, isRequired: true, decimalScale: 3, ref: stoneWeightRef },
        { key: "stoneUnit", label: "Unit", type: "select" as const, isRequired: true, collection: { items: [{ label: "Gram", value: "g" }, { label: "Carat", value: "c" }] }, ref: stoneUnitRef },
        { key: "stoneCalculation", label: "Cal", type: "select" as const, isRequired: true, collection: { items: [{ label: "Weight", value: "w" }, { label: "Piece", value: "p" }] }, ref: stoneCalculationRef },
        { key: "stoneRate", label: "Rate", type: "number" as const, isRequired: true, decimalScale: 2, ref: stoneRateRef },
        { key: "stoneAmount", label: "Amount", type: "number" as const, isRequired: false, decimalScale: 2, ref: stoneRateRef, disabled: true },
    ];

    /* ---------------- CALCULATION ---------------- */
    const calculateAmount = (data: typeof formData) => {
        let weight = Number(data.stoneWeight) || 0;
        const pcs = Number(data.stonePcs) || 0;
        const rate = Number(data.stoneRate) || 0;
        if (data.stoneCalculation === "w") return weight * rate;
        if (data.stoneCalculation === "p") return pcs * rate;
        return 0;
    };

    const totalUsedWeight = rows.reduce((sum, r) => {
        return sum + (r.stoneUnit === "c" ? Number(r.stoneWeight) / 5 : Number(r.stoneWeight));
    }, 0);

    /* ---------------- FOCUS HELPER ---------------- */
    const focusField = useCallback((key: FieldKey) => {
        setTimeout(() => {
            const ref = fieldRefs[key];
            ref?.current?.focus?.();
            ref?.current?.select?.();
        }, 50);
    }, []);

    const moveToNext = useCallback((currentKey: FieldKey) => {
        const idx = FIELD_ORDER.indexOf(currentKey);
        if (idx < FIELD_ORDER.length - 1) {
            focusField(FIELD_ORDER[idx + 1]);
        } else {
            handleSubmit();
        }
    }, [formData]);

    /* ---------------- VALIDATION with focus + toaster ---------------- */
    const validateForm = useCallback((): boolean => {
        const newErrors: Record<string, string> = {};
        const newTouched: Record<string, boolean> = {};

        FIELD_ORDER.forEach(k => { newTouched[k] = true; });

        if (!formData.stoneId) newErrors.stoneId = "Stone is required";
        if (!formData.subStoneId) newErrors.subStoneId = "Sub Stone is required";

        const pcs = Number(formData.stonePcs);
        if (!formData.stonePcs || isNaN(pcs) || pcs <= 0)
            newErrors.stonePcs = "Pcs must be greater than 0";

        const weight = Number(formData.stoneWeight);
        if (!formData.stoneWeight || isNaN(weight) || weight <= 0)
            newErrors.stoneWeight = "Weight must be greater than 0";

        const rate = Number(formData.stoneRate);
        if (!formData.stoneRate || isNaN(rate) || rate <= 0)
            newErrors.stoneRate = "Rate must be greater than 0";

        setErrors(newErrors);
        setTouched(newTouched);

        if (Object.keys(newErrors).length > 0) {
            // Focus the first errored field
            const firstError = FIELD_ORDER.find(k => newErrors[k]);
            if (firstError) {
                focusField(firstError);
                toaster.create({
                    title: "Validation Error",
                    description: newErrors[firstError],
                    type: "error",
                    duration: 2000,
                });
            }
            return false;
        }
        return true;
    }, [formData, focusField]);

    /* ---------------- HANDLERS ---------------- */
    const handleChange = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        setTouched(prev => ({ ...prev, [key]: true }));
        setErrors(prev => ({ ...prev, [key]: "" }));
    };

    const handleSubmit = useCallback(() => {
        if (!validateForm()) return;

        const currentWeight = formData.stoneUnit === "c"
            ? Number(formData.stoneWeight) / 5
            : Number(formData.stoneWeight);

        const baseWeight = editId
            ? rows.filter(r => r.id !== editId).reduce((sum, r) =>
                sum + (r.stoneUnit === "c" ? Number(r.stoneWeight) / 5 : Number(r.stoneWeight)), 0)
            : rows.reduce((sum, r) =>
                sum + (r.stoneUnit === "c" ? Number(r.stoneWeight) / 5 : Number(r.stoneWeight)), 0);

        if (baseWeight + currentWeight > Number(grsWeight)) {
            toaster.create({
                title: "Weight Exceeded",
                description: `Maximum available: ${Number(grsWeight).toFixed(3)}g`,
                type: "error",
                duration: 3000,
            });
            focusField("stoneWeight");
            return;
        }

        const emptyStoneRow = !editId ? rows.find(r =>
            !r.stoneId || r.stoneId === "" || !r.stonePcs || r.stonePcs === 0 ||
            !r.stoneWeight || r.stoneWeight === 0 || !r.stoneRate || r.stoneRate === 0
        ) : null;

        const newRow: StoneRow = {
            id: editId ?? (emptyStoneRow?.id || `stone-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`),
            draftRowId,
            stoneId: formData.stoneId,
            subStoneId: formData.subStoneId,
            stonePcs: Number(formData.stonePcs),
            stoneWeight: Number(formData.stoneWeight),
            stoneUnit: formData.stoneUnit,
            stoneCalculation: formData.stoneCalculation,
            stoneRate: Number(formData.stoneRate),
            stoneAmount: calculateAmount(formData),
        };

        if (editId) {
            setRows(prev => prev.map(r => r.id === editId ? newRow : r));
            setEditId(null);
        } else if (emptyStoneRow) {
            setRows(prev => prev.map(r => r.id === emptyStoneRow.id ? newRow : r));
        } else {
            setRows(prev => [...prev, newRow]);
        }

        resetForm();
    }, [formData, editId, rows, draftRowId, grsWeight, validateForm, focusField]);

    const resetForm = () => {
        setFormData(emptyForm);
        setErrors({});
        setTouched({});
        setTimeout(() => { stoneIdRef.current?.focus(); }, 100);
    };

    const handleEditRow = (row: StoneRow) => {
        setFormData({
            stoneId: row.stoneId,
            subStoneId: row.subStoneId,
            stonePcs: row.stonePcs.toString(),
            stoneWeight: row.stoneWeight.toString(),
            stoneUnit: row.stoneUnit,
            stoneCalculation: row.stoneCalculation,
            stoneRate: row.stoneRate.toString(),
            stoneAmount: row.stoneAmount,
        });
        setEditId(row.id);
        setErrors({});
        setTouched({});
        setTimeout(() => { stoneIdRef.current?.focus(); }, 100);
    };

    const handleDeleteRow = (row: StoneRow) => {
        if (confirm("Delete this row?")) {
            const remainingRows = rows.filter(r => r.id !== row.id);
            if (remainingRows.length === 0) {
                setRows([]);
            } else {
                setRows(remainingRows);
            }
            if (editId === row.id) resetForm();
        }
    };

    const handleSaveAndClose = () => {
        saveStonesToStorage();
        onSave(rows);
        onClose();
    };

    /* ---------------- RENDER FORM CELL ---------------- */
    const renderFormCell = (field: any) => {
        const ref = fieldRefs[field.key as FieldKey];
        const isInvalid = !!errors[field.key] && !!touched[field.key];
        const value = formData[field.key as keyof typeof formData]?.toString() || "";

        // stoneAmount is display-only / calculated
        if (field.key === "stoneAmount") {
            return (
                <Box
                    px={1} py="2px" fontSize="11px" textAlign="right"
                    color={formData.stoneAmount > 0 ? "green.600" : "gray.400"}
                    fontWeight="medium"
                >
                    {formData.stoneAmount > 0 ? formData.stoneAmount.toFixed(2) : ""}
                </Box>
            );
        }

        if (field.type === "combobox") {
            return (
                <Box position="relative">
                    <SelectCombobox
                        value={value}
                        items={field.collection?.items || []}
                        onChange={val => {
                            handleChange(field.key, val);
                            if (val) moveToNext(field.key as FieldKey);
                        }}
                        ref={ref as React.RefObject<HTMLInputElement>}
                        onEnter={() => moveToNext(field.key as FieldKey)}
                        rounded="sm"
                        placeholder={`Select ${field.label}`}
                    />
                    {isInvalid && (
                        <Text fontSize="9px" color="red.500" position="absolute" bottom="-13px" left="2px" whiteSpace="nowrap">
                            {errors[field.key]}
                        </Text>
                    )}
                </Box>
            );
        }

        if (field.type === "select") {
            return (
                <NativeSelect.Root size="xs">
                    <NativeSelect.Field
                        ref={ref as React.RefObject<HTMLSelectElement>}
                        value={value}
                        onChange={e => handleChange(field.key, e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                moveToNext(field.key as FieldKey);
                            }
                        }}
                        css={{ height: "28px", fontSize: "11px" }}
                    >
                        {field.collection?.items.map((item: any) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                </NativeSelect.Root>
            );
        }

        return (
            <Box position="relative">
                <CapitalizedInput
                    value={value}
                    field={field.key}
                    type="number"
                    allowDecimal={field.decimalScale > 0}
                    onChange={(f, v) => handleChange(f, v)}
                    inputRef={ref}
                    onEnter={() => moveToNext(field.key as FieldKey)}
                    size="xs"
                    rounded="sm"
                    noBorder
                    disabled={field.disabled}
                />
                {isInvalid && (
                    <Text fontSize="9px" color="red.500" position="absolute" bottom="-13px" left="2px" whiteSpace="nowrap">
                        {errors[field.key]}
                    </Text>
                )}
            </Box>
        );
    };

    const getCellValue = (col: any, row: StoneRow) => {
        if (col.key === "stoneAmount") return row.stoneAmount.toFixed(2);
        if (col.key === "stoneWeight") return Number(row.stoneWeight).toFixed(3);
        if (col.key === "stoneRate") return Number(row.stoneRate).toFixed(2);
        if (col.key === "stoneId") {
            const item = stoneItems.find(i => i.value === row.stoneId);
            return item?.label || row.stoneId || "-";
        }
        if (col.key === "subStoneId") {
            const item = subStoneItems.find(i => i.value === row.subStoneId);
            return item?.label || row.subStoneId || "-";
        }
        return row[col.key as keyof StoneRow];
    };

    const formatTotal = (value: any, decimalScale?: number) => {
        if (value == null) return "";
        return Number(value).toFixed(decimalScale || 0);
    };

    const totals = {
        stonePcs: rows.reduce((sum, r) => sum + r.stonePcs, 0),
        stoneWeight: rows.reduce((sum, r) => sum + (r.stoneUnit === "c" ? r.stoneWeight / 5 : r.stoneWeight), 0),
        stoneAmount: rows.reduce((sum, r) => sum + r.stoneAmount, 0),
    };

    const remainingWeight = Number(grsWeight) - totalUsedWeight;
    const isOverWeight = totalUsedWeight > Number(grsWeight);

    /* ---------------- UI ---------------- */
    return (
        <Box p={2}>
            <HStack justify="space-between" mb={2}>
                <HStack gap={3}>
                    <Text fontSize="small" fontWeight="semibold">
                        Stone Entry
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                        Available: <Text as="span" fontWeight="semibold" color={isOverWeight ? "red.500" : "green.600"}>
                            {remainingWeight.toFixed(3)}g
                        </Text>
                        {" / "}{Number(grsWeight).toFixed(3)}g
                    </Text>
                </HStack>
                <IconButton aria-label="Close (ESC)" onClick={onClose} size="xs" variant="ghost" title="Close (ESC)">
                    <LuX size={14} />
                </IconButton>
            </HStack>

            <TransactionTable
                theme={{ colors: { borderColor: "#CBD5E0", formColor: "#EDF2F7" } }}
                tableCols={tableCols}
                formFields={formFields}
                rows={rows}
                formData={formData}
                errors={errors}
                touched={touched}
                localEditId={editId}
                isSubmitting={isSubmitting}
                totals={totals}
                stripedBg="#F7FAFC"
                allDisplayCols={allDisplayCols}
                resetForm={resetForm}
                handleSubmit={handleSubmit}
                handleEditRow={handleEditRow}
                handleDeleteRow={handleDeleteRow}
                renderFormCell={renderFormCell}
                getCellValue={getCellValue}
                formatTotal={formatTotal}
                getCellStyle={getCellStyle}
            />

            <HStack justify="flex-end" gap={2} mt={4}>
                <Text m={2} fontSize="small" fontWeight="500" color={isOverWeight ? "red.500" : "inherit"}>
                    Used: {Number(totalUsedWeight).toFixed(3)} / {Number(grsWeight).toFixed(3)} g
                    {isOverWeight && " ⚠ Over limit!"}
                </Text>
                <Button variant="outline" size="xs" onClick={onClose} title="ESC">
                    Cancel (ESC)
                </Button>
                <Button colorPalette="blue" size="xs" onClick={handleSaveAndClose}>
                    Save & Close
                </Button>
            </HStack>
        </Box>
    );
}