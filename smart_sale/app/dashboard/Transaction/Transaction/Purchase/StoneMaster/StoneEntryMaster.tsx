"use client";

import { useState, useRef, useEffect } from "react";
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

/* ─── COLUMN WIDTHS ─── */
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

/* ─── CELL STYLE HELPER ─── */
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

export default function StoneEnterMaster({
    grsWeight = 0,
    onClose,
    onSave,
    initialRows = [],
    stoneItems = [],
    subStoneItems = [],
    draftRowId
}: Props) {
    /* ---------------- TABLE COLUMNS ---------------- */

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

    /* ---------------- STATE ---------------- */

    const emptyForm = {
        stoneId: "",
        subStoneId: "",
        stonePcs: "",
        stoneWeight: "",
        stoneUnit: "g" as "g" | "c",
        stoneCalculation: "w" as "w" | "p",
        stoneRate: "",
    };

    const [formData, setFormData] = useState<{
        stoneId: string;
        subStoneId: string;
        stonePcs: string;
        stoneWeight: string;
        stoneUnit: "g" | "c";
        stoneCalculation: "w" | "p";
        stoneRate: string;
    }>(emptyForm);

    const [rows, setRows] = useState<StoneRow[]>([]);
    const [editId, setEditId] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    
    const hasLoadedRef = useRef(false);
    // Create refs for each field


    const stoneIdRef = useRef<any>(null);
    const subStoneIdRef = useRef<any>(null);
    const stonePcsRef = useRef<HTMLInputElement>(null);
    const stoneWeightRef = useRef<HTMLInputElement>(null);
    const stoneUnitRef = useRef<HTMLSelectElement>(null);
    const stoneCalculationRef = useRef<HTMLSelectElement>(null);
    const stoneRateRef = useRef<HTMLInputElement>(null);

    const fieldRefs = {
        stoneId: stoneIdRef,
        subStoneId: subStoneIdRef,
        stonePcs: stonePcsRef,
        stoneWeight: stoneWeightRef,
        stoneUnit: stoneUnitRef,
        stoneCalculation: stoneCalculationRef,
        stoneRate: stoneRateRef,
    };

   
    // Load stones from localStorage ONLY when draftRowId changes
    useEffect(() => {
        if (!draftRowId) return;

        // Prevent double loading
        if (hasLoadedRef.current && rows.length > 0) {
            console.log(`Already loaded stones for ${draftRowId}, skipping...`);
            return;
        }

        const all: StoneRow[] = JSON.parse(localStorage.getItem('STONE_MASTER') || "[]");
        let linked = all.filter(s => s.draftRowId === draftRowId);

        console.log(`Loaded ${linked.length} raw stones for draft row ${draftRowId}:`, linked);

        // Filter out empty rows - but keep at least one empty row if no data
        const nonEmptyRows = linked.filter(s =>
            s.stoneId && s.stoneId !== "" &&
            (s.stonePcs && s.stonePcs > 0) &&
            (s.stoneWeight && s.stoneWeight > 0) &&
            (s.stoneRate && s.stoneRate > 0)
        );

        console.log(`Found ${nonEmptyRows.length} non-empty stones`);

        if (nonEmptyRows.length > 0) {
            // We have real data, only keep the non-empty rows
            setRows(nonEmptyRows);

            // Update localStorage to remove empty rows
            const filtered = all.filter(s =>
                s.draftRowId !== draftRowId ||
                (s.stoneId && s.stoneId !== "" && s.stonePcs > 0 && s.stoneWeight > 0 && s.stoneRate > 0)
            );
            localStorage.setItem('STONE_MASTER', JSON.stringify(filtered));
        } else {
            // No real data, keep one empty row
            // const emptyRow = linked.length > 0 ? linked[0] : {
            //     id: `stone-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            //     draftRowId: draftRowId,
            //     stoneId: "",
            //     subStoneId: "",
            //     stonePcs: 0,
            //     stoneWeight: 0,
            //     stoneUnit: "g" as "g" | "c",
            //     stoneCalculation: "w" as "w" | "p",
            //     stoneRate: 0,
            //     stoneAmount: 0,
            // };
            // setRows([emptyRow]);
        }

        setIsInitialized(true);
        hasLoadedRef.current = true;

        // Focus first field when modal opens
        setTimeout(() => {
            stoneIdRef.current?.focus?.();
        }, 100);

        // Reset the ref when modal closes
        return () => {
            setTimeout(() => {
                hasLoadedRef.current = false;
            }, 300);
        };
    }, [draftRowId]);


    // Save to localStorage only when rows change AND we're initialized
    useEffect(() => {
        if (!isInitialized || !draftRowId) return;
        saveStonesToStorage();
    }, [rows, draftRowId, isInitialized]);

    const saveStonesToStorage = () => {
        const all: StoneRow[] = JSON.parse(localStorage.getItem('STONE_MASTER') || "[]");

        // Remove ALL existing stones for THIS draft row
        const filtered = all.filter(s => s.draftRowId !== draftRowId);

        // Filter out empty rows before saving - only keep rows with real data
        const nonEmptyRows = rows.filter(s =>
            s.stoneId && s.stoneId !== "" &&
            s.stonePcs > 0 &&
            s.stoneWeight > 0 &&
            s.stoneRate > 0
        );

        console.log(`Saving ${nonEmptyRows.length} non-empty stones for draft row ${draftRowId}`);

        // Add current rows (only non-empty)
        const updated = [...filtered, ...nonEmptyRows];

        localStorage.setItem('STONE_MASTER', JSON.stringify(updated));
    };


    
    /* ---------------- FORM FIELDS DEFINITION ---------------- */

    const formFields = [
        {
            key: "stoneId",
            label: "Stone",
            type: "combobox" as const,
            isRequired: true,
            collection: { items: stoneItems },
            ref: stoneIdRef,
        },
        {
            key: "subStoneId",
            label: "Sub Stone",
            type: "combobox" as const,
            isRequired: true,
            collection: { items: subStoneItems },
            ref: subStoneIdRef,
        },
        {
            key: "stonePcs",
            label: "Pcs",
            type: "number" as const,
            isRequired: true,
            decimalScale: 0,
            ref: stonePcsRef,
        },
        {
            key: "stoneWeight",
            label: "Weight",
            type: "number" as const,
            isRequired: true,
            decimalScale: 3,
            ref: stoneWeightRef,
        },
        {
            key: "stoneUnit",
            label: "Unit",
            type: "select" as const,
            isRequired: true,
            collection: {
                items: [
                    { label: "Gram", value: "g" },
                    { label: "Carat", value: "c" },
                ]
            },
            ref: stoneUnitRef,
        },
        {
            key: "stoneCalculation",
            label: "Cal",
            type: "select" as const,
            isRequired: true,
            collection: {
                items: [
                    { label: "Weight", value: "w" },
                    { label: "Piece", value: "p" },
                ]
            },
            ref: stoneCalculationRef,
        },
        {
            key: "stoneRate",
            label: "Rate",
            type: "number" as const,
            isRequired: true,
            decimalScale: 2,
            ref: stoneRateRef,
        },
    ];

    /* ---------------- CALCULATION ---------------- */

    const calculateAmount = (data: typeof formData) => {
        let weight = Number(data.stoneWeight) || 0;
        const pcs = Number(data.stonePcs) || 0;
        const rate = Number(data.stoneRate) || 0;

        if (data.stoneUnit === "c") weight = weight / 5;

        if (data.stoneCalculation === "w") return weight * rate;
        if (data.stoneCalculation === "p") return pcs * weight * rate;

        return 0;
    };

    /* ---------------- TOTAL USED ---------------- */

    const totalUsedWeight = rows.reduce((sum, r) => {
        const w = r.stoneUnit === "c" ? Number(r.stoneWeight) / 5 : Number(r.stoneWeight);
        return sum + w;
    }, 0);

    /* ---------------- VALIDATION ---------------- */

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.stoneId) newErrors.stoneId = "Stone is required";
        if (!formData.subStoneId) newErrors.subStoneId = "Sub Stone is required";

        const pcs = Number(formData.stonePcs);
        if (!formData.stonePcs || isNaN(pcs) || pcs <= 0) {
            newErrors.stonePcs = "Pcs must be greater than 0";
        }

        const weight = Number(formData.stoneWeight);
        if (!formData.stoneWeight || isNaN(weight) || weight <= 0) {
            newErrors.stoneWeight = "Weight must be greater than 0";
        }

        const rate = Number(formData.stoneRate);
        if (!formData.stoneRate || isNaN(rate) || rate <= 0) {
            newErrors.stoneRate = "Rate must be greater than 0";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /* ---------------- HANDLERS ---------------- */

    const handleChange = (key: string, value: any) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
        setTouched((prev) => ({ ...prev, [key]: true }));
        setErrors((prev) => ({ ...prev, [key]: "" }));
    };

    const handleSubmit = () => {
        if (!validateForm()) return;

        const currentWeight =
            formData.stoneUnit === "c" ? Number(formData.stoneWeight) / 5 : Number(formData.stoneWeight);

        const baseWeight = editId
            ? rows
                .filter((r) => r.id !== editId)
                .reduce(
                    (sum, r) =>
                        sum + (r.stoneUnit === "c" ? Number(r.stoneWeight) / 5 : Number(r.stoneWeight)),
                    0
                )
            : rows.reduce(
                (sum, r) =>
                    sum + (r.stoneUnit === "c" ? Number(r.stoneWeight) / 5 : Number(r.stoneWeight)),
                0
            );

        if (baseWeight + currentWeight > Number(grsWeight)) {
            alert(`Weight exceeded! Maximum available: ${grsWeight.toFixed(3)}g`);
            return;
        }

        // Check if there's an empty stone row that we should update
        // An empty row has all stone-related fields empty/zero
        const emptyStoneRow = !editId ? rows.find(r =>
            !r.stoneId || r.stoneId === "" ||
            !r.stonePcs || r.stonePcs === 0 ||
            !r.stoneWeight || r.stoneWeight === 0 ||
            !r.stoneRate || r.stoneRate === 0
        ) : null;

        console.log('Empty stone row found:', emptyStoneRow);

        const newRow: StoneRow = {
            id: editId ?? (emptyStoneRow?.id || `stone-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`),
            draftRowId: draftRowId,
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
            // Updating an existing row
            console.log('Updating existing row:', newRow);
            setRows(prev => prev.map((r) => (r.id === editId ? newRow : r)));
            setEditId(null);
        } else if (emptyStoneRow) {
            // Replace the empty stone row with the new data
            console.log('Replacing empty row with data:', newRow);
            setRows(prev => prev.map((r) => (r.id === emptyStoneRow.id ? newRow : r)));
        } else {
            // Add a new row
            console.log('Adding new row:', newRow);
            setRows(prev => [...prev, newRow]);
        }

        resetForm();
    };
    const resetForm = () => {
        setFormData(emptyForm);
        setErrors({});
        setTouched({});
        setTimeout(() => {
            stoneIdRef.current?.focus();
        }, 100);
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
        });
        setEditId(row.id);
        setTimeout(() => {
            stoneIdRef.current?.focus();
        }, 100);
    };

    const handleDeleteRow = (row: StoneRow) => {
        if (confirm("Delete this row?")) {
            // Filter out the deleted row
            const remainingRows = rows.filter((r) => r.id !== row.id);

            // Check if we have any non-empty rows left
            const hasNonEmptyRows = remainingRows.some(r =>
                r.stoneId && r.stoneId !== "" && r.stonePcs > 0 && r.stoneWeight > 0 && r.stoneRate > 0
            );

            if (!hasNonEmptyRows && remainingRows.length === 0) {
                // No rows left, create a new empty row
                const emptyRow: StoneRow = {
                    id: `stone-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    draftRowId: draftRowId,
                    stoneId: "",
                    subStoneId: "",
                    stonePcs: 0,
                    stoneWeight: 0,
                    stoneUnit: "g",
                    stoneCalculation: "w",
                    stoneRate: 0,
                    stoneAmount: 0,
                };
                setRows([emptyRow]);
            } else {
                // Keep the remaining rows (which include non-empty rows)
                setRows(remainingRows);
            }

            if (editId === row.id) {
                resetForm();
            }
        }
    };

    const handleSaveAndClose = () => {
        // Final save before closing
        saveStonesToStorage();
        onSave(rows);
        onClose();
    };

    /* ---------------- RENDER FORM CELL ---------------- */

    const renderFormCell = (field: any) => {
        const ref = fieldRefs[field.key as keyof typeof fieldRefs];
        const isInvalid = !!errors[field.key] && !!touched[field.key];
        const value = formData[field.key as keyof typeof formData]?.toString() || "";

        if (field.type === "combobox") {
            return (
                <SelectCombobox
                    value={value}
                    items={field.collection?.items || []}
                    onChange={(val) => handleChange(field.key, val)}
                    ref={ref as React.RefObject<HTMLInputElement>}
                    onEnter={() => {
                        const keys = Object.keys(fieldRefs);
                        const currentIndex = keys.indexOf(field.key);
                        if (currentIndex < keys.length - 1) {
                            const nextRef = fieldRefs[keys[currentIndex + 1] as keyof typeof fieldRefs];
                            setTimeout(() => nextRef?.current?.focus?.(), 50);
                        } else {
                            handleSubmit();
                        }
                    }}
                    rounded="sm"
                    placeholder={`Select ${field.label}`}
                />
            );
        }

        if (field.type === "select") {
            return (
                <NativeSelect.Root size="xs">
                    <NativeSelect.Field
                        ref={ref as React.RefObject<HTMLSelectElement>}
                        value={value}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                const keys = Object.keys(fieldRefs);
                                const currentIndex = keys.indexOf(field.key);
                                if (currentIndex < keys.length - 1) {
                                    const nextRef = fieldRefs[keys[currentIndex + 1] as keyof typeof fieldRefs];
                                    setTimeout(() => nextRef?.current?.focus?.(), 50);
                                } else {
                                    handleSubmit();
                                }
                            }
                        }}
                        css={{ height: '28px', fontSize: '11px' }}
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
            <CapitalizedInput
                value={value}
                field={field.key}
                type="number"
                allowDecimal={field.decimalScale > 0}
                onChange={(field, value) => handleChange(field, value)}
                inputRef={ref}
                onEnter={() => {
                    const keys = Object.keys(fieldRefs);
                    const currentIndex = keys.indexOf(field.key);
                    if (currentIndex < keys.length - 1) {
                        const nextRef = fieldRefs[keys[currentIndex + 1] as keyof typeof fieldRefs];
                        setTimeout(() => nextRef?.current?.focus?.(), 50);
                    } else {
                        handleSubmit();
                    }
                }}
                size="xs"
                rounded="sm"
                noBorder
            />
        );
    };

    const getCellValue = (col: any, row: StoneRow) => {
        if (col.key === "stoneAmount") {
            return row.stoneAmount.toFixed(2);
        }
        if (col.key === "stoneWeight") {
            return Number(row.stoneWeight).toFixed(3);
        }
        if (col.key === "stoneRate") {
            return Number(row.stoneRate).toFixed(2);
        }

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
        stoneWeight: rows.reduce((sum, r) => {
            const w = r.stoneUnit === "c" ? r.stoneWeight / 5 : r.stoneWeight;
            return sum + w;
        }, 0),
        stoneAmount: rows.reduce((sum, r) => sum + r.stoneAmount, 0),
    };

    /* ---------------- UI ---------------- */

    return (
        <Box p={2}>
            <HStack justify="space-between" mb={2}>
                <Text fontSize="small" fontWeight="semibold">
                    Stone Entry - Available Weight: {Number(grsWeight).toFixed(3)}g
                </Text>
                <IconButton
                    aria-label="Close"
                    onClick={onClose}
                    size="xs"
                    variant='ghost'
                >
                    <LuX size={14} />
                </IconButton>
            </HStack>

            <TransactionTable
                theme={{
                    colors: {
                        borderColor: "#CBD5E0",
                        formColor: "#EDF2F7",
                    }
                }}
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
                <Text m={2} fontSize='small' fontWeight="500">
                    Total Used: {Number(totalUsedWeight).toFixed(3)} / {Number(grsWeight).toFixed(3)} g
                </Text>
                <Button variant="outline" size='xs' onClick={onClose}>
                    Cancel
                </Button>
                <Button colorPalette="blue" size='xs' onClick={handleSaveAndClose}>
                    Save & Close
                </Button>
            </HStack>
        </Box>
    );
}