"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
    Box,
    Text,
    NativeSelect,
    Button,
    HStack,
} from "@chakra-ui/react";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { SelectCombobox, SelectItem } from "@/components/ui/selectComboBox";
import { toaster } from "@/components/ui/toaster";
import { useGlobalKey } from "@/components/key/useGlobalKey";
import ExcelGrid, { ColumnDef, RenderCellParams } from "@/component/table/ExcelGrid";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StoneRow = {
    __id: string;
    draftRowId: string;
    stoneId: string;
    stonePcs: string;
    stoneWeight: string;
    stoneUnit: "g" | "c";
    stoneCalculation: "w" | "p";
    stoneRate: string;
    stoneAmount: string;
};

type Props = {
    draftRowId: string;
    grsWeight?: number;
    onClose: () => void;
    onSave: (rows: any[]) => void;
    initialRows?: any[];
    stoneItems?: SelectItem[];
};

// ─── Column definitions ───────────────────────────────────────────────────────

const COLUMNS: ColumnDef[] = [
    { key: "stoneId", label: "STONE", width: 120, required: true },
    { key: "stonePcs", label: "PCS", width: 30, align: "right", decimalScale: 0 },
    { key: "stoneWeight", label: "WEIGHT", width: 50, align: "right", decimalScale: 3, required: true },
    { key: "stoneUnit", label: "UNIT", width: 50, align: "center" },
    { key: "stoneCalculation", label: "CAL", width: 50, align: "center" },
    { key: "stoneRate", label: "RATE", width: 90, align: "right", decimalScale: 2 },
    { key: "stoneAmount", label: "AMOUNT", width: 100, align: "right", decimalScale: 2 ,disabled:true},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _uid = 0;
function uid() { return `st_${++_uid}_${Date.now()}`; }

function emptyRow(draftRowId: string): StoneRow {
    return {
        __id: uid(),
        draftRowId,
        stoneId: "",
        stonePcs: "",
        stoneWeight: "",
        stoneUnit: "g",
        stoneCalculation: "w",
        stoneRate: "",
        stoneAmount: "0",
    };
}
function calculateStoneAmount(
    unit: "g" | "c",
    weight: string,
    pcs: string,
    rate: string,
    calculation: "w" | "p" | "c"
): number {
    const w = parseFloat(weight) || 0;
    const p = parseFloat(pcs) || 0;
    const r = parseFloat(rate) || 0;

    if (unit === "g") {
        if (calculation === "w") return w * r;
        if (calculation === "p") return p * r;
        if (calculation === "c") return w * r * 5;
    } else {
        if (calculation === "w") return (w / 5) * r;
        if (calculation === "p") return p * r;
        if (calculation === "c") return (w / 5) * r * 5;
    }

    return 0;
}

const RECALC_FIELDS = new Set([
    "stoneUnit",
    "stoneWeight",
    "stonePcs",
    "stoneRate",
    "stoneCalculation",
]);
// ─── Component ────────────────────────────────────────────────────────────────

export default function StoneEnterMaster({
    grsWeight = 0,
    onClose,
    onSave,
    initialRows = [],
    stoneItems = [],
    draftRowId
}: Props) {

    // ── Rows state ─────────────────────────────────────────────────────────────
    const [rows, setRows] = useState<StoneRow[]>(() => {
        if (initialRows.length > 0) {
            return initialRows.map(r => ({
                __id: r.id ?? uid(),
                draftRowId: r.draftRowId ?? draftRowId,
                stoneId: r.stoneId ?? "",
                stonePcs: r.stonePcs != null ? String(r.stonePcs) : "",
                stoneWeight: r.stoneWeight != null ? String(r.stoneWeight) : "",
                stoneUnit: r.stoneUnit ?? "g",
                stoneCalculation: r.stoneCalculation ?? "w",
                stoneRate: r.stoneRate != null ? String(r.stoneRate) : "",
                stoneAmount: r.stoneAmount != null ? String(r.stoneAmount) : "0",
            }));
        }
        return [emptyRow(draftRowId)];
    });

    // Sync when initialRows prop changes
    const prevInitialRef = useRef("");
    useEffect(() => {
        const key = JSON.stringify(initialRows);
        if (key === prevInitialRef.current) return;
        prevInitialRef.current = key;

        if (initialRows.length > 0) {
            setRows(initialRows.map(r => ({
                __id: r.id ?? uid(),
                draftRowId: r.draftRowId ?? draftRowId,
                stoneId: r.stoneId ?? "",
                stonePcs: r.stonePcs != null ? String(r.stonePcs) : "",
                stoneWeight: r.stoneWeight != null ? String(r.stoneWeight) : "",
                stoneUnit: r.stoneUnit ?? "g",
                stoneCalculation: r.stoneCalculation ?? "w",
                stoneRate: r.stoneRate != null ? String(r.stoneRate) : "",
                stoneAmount: r.stoneAmount != null ? String(r.stoneAmount) : "0",
            })));
        } else {
            setRows([emptyRow(draftRowId)]);
        }
    }, [initialRows, draftRowId]);

    // ── Validation ────────────────────────────────────────────────────────────
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const errors = useMemo<Record<string, string>>(() => {
        const errs: Record<string, string> = {};
        rows.forEach((row, ri) => {
            if(row.stoneId){
                // if (row.stoneId || row.stoneId.trim() === "")
                //     errs[`${ri}_stoneId`] = "Stone is required";
                // const rate = parseFloat(row.stoneRate);
                // if (!row.stoneRate || isNaN(rate) || rate <= 0)
                //     errs[`${ri}_stoneRate`] = "Rate must be > 0";
                const weight = parseFloat(row.stoneWeight);
                if (!row.stoneWeight || isNaN(weight) || weight <= 0)
                    errs[`${ri}_stoneWeight`] = "Weight must be > 0";
            }
            
        });
        return errs;
    }, [rows]);

    // ── Weight calculations ───────────────────────────────────────────────────
    const totalUsedWeight = useMemo(() => {
        return rows.reduce((sum, r) => {
            const weight = parseFloat(r.stoneWeight) || 0;
            return sum + (r.stoneUnit === "c" ? weight / 5 : weight);
        }, 0);
    }, [rows]);

    const remainingWeight = Number(grsWeight) - totalUsedWeight;
    const isOverWeight = totalUsedWeight > Number(grsWeight);

    // ── Cell change handler ───────────────────────────────────────────────────
    const handleCellChange = useCallback((ri: number, colKey: string, value: any) => {
        setRows(prev => {
            const next = [...prev];
            const updated = { ...next[ri], [colKey]: value };

            if (RECALC_FIELDS.has(colKey)) {
                // Always use latest value for the changed field
                const amount = calculateStoneAmount(
                    (colKey === "stoneUnit" ? value : updated.stoneUnit) as "g" | "c",
                    colKey === "stoneWeight" ? value : updated.stoneWeight,
                    colKey === "stonePcs" ? value : updated.stonePcs,
                    colKey === "stoneRate" ? value : updated.stoneRate,
                    (colKey === "stoneCalculation" ? value : updated.stoneCalculation) as "w" | "p" | "c",
                );
                updated.stoneAmount = amount > 0 ? String(Math.round(amount)) : "";
            }

            next[ri] = updated;
            return next;
        });

        setTouched(prev => ({ ...prev, [`${ri}_${colKey}`]: true }));
    }, []);


    // ── Row management ────────────────────────────────────────────────────────
    const handleRowAdd = useCallback(() => {
        setRows(prev => [...prev, emptyRow(draftRowId)]);
    }, [draftRowId]);

    const handleRowDelete = useCallback((ri: number) => {
        setRows(prev => {
            const next = prev.filter((_, i) => i !== ri);
            return next.length === 0 ? [emptyRow(draftRowId)] : next;
        });
    }, [draftRowId]);


   

    // ── Render cell ───────────────────────────────────────────────────────────
    const renderCell = useCallback((params: RenderCellParams) => {
        const { col, value, isEditing, isFocused, isError, errorMessage, onChange, onCommit, inputRef, row, rowIndex } = params;

        // ── stoneId — SelectCombobox ──────────────────────────────────────────
        if (col.key === "stoneId") {
            return (
                <SelectCombobox
                    value={value}
                    items={stoneItems}
                    onChange={(val) => {
                        onChange(val);
                        if (val) onCommit();
                    }}
                    ref={inputRef}
                    onEnter={onCommit}
                    rounded="sm"
                    placeholder="Select stone"
                />
            );
        }

        // ── stoneUnit — NativeSelect ──────────────────────────────────────────
        if (col.key === "stoneUnit") {
            return (
                <NativeSelect.Root size="xs">
                    <NativeSelect.Field
                        ref={inputRef as any}
                        value={value || "g"}
                        onChange={(e) => {
                            onChange(e.target.value);
                            // onCommit();
                        }}
                        css={{ height: "28px", fontSize: "11px" }}
                    >
                        <option value="g">Gram</option>
                        <option value="c">Carat</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                </NativeSelect.Root>
            );
        }

        // ── stoneCalculation — NativeSelect ───────────────────────────────────
        if (col.key === "stoneCalculation") {
            return (
                <NativeSelect.Root size="xs">
                    <NativeSelect.Field
                        ref={inputRef as any}
                        value={value || "w"}
                        onChange={(e) => {
                            onChange(e.target.value);
                           
                        }}
                        css={{ height: "28px", fontSize: "11px" }}
                    >
                        <option value="w">Weight (gm)</option>
                        <option value="p">Piece</option>
                        <option value="c">Carat</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                </NativeSelect.Root>
            );
        }

        // ── stoneAmount — Display only (calculated) ───────────────────────────
        if (col.key === "stoneAmount") {
            const amount = parseFloat(value) || 0;
            return (
                <div style={{
                    padding: "0 6px",
                    fontSize: 11,
                    textAlign: "right",
                    width: "100%",
                    color: amount > 0 ? "#2F855A" : "#A0AEC0",
                    fontWeight: 500
                }}>
                    {amount > 0 ? amount.toFixed(2) : "—"}
                </div>
            );
        }

        // ── Numeric fields (stonePcs, stoneWeight, stoneRate) ─────────────────
        if (["stonePcs", "stoneWeight", "stoneRate"].includes(col.key)) {
            const decimalScale = col.key === "stonePcs" ? 0 : col.key === "stoneWeight" ? 3 : 2;

            // View mode
            if (!isEditing && !isFocused) {
                const n = parseFloat(value);
                return (
                    <div style={{ padding: "0 6px", fontSize: 11, textAlign: "right", width: "100%" }}>
                        {isNaN(n) ? "—" : n.toFixed(decimalScale)}
                    </div>
                );
            }

            return (
                <CapitalizedInput
                    field={col.key}
                    value={value}
                    type="number"
                    allowDecimal={decimalScale > 0}
                    decimalScale={decimalScale}
                    onChange={(_, v) => onChange(v)}
                    inputRef={inputRef}
                    onEnter={onCommit}
                    size="xs"
                    rounded="sm"
                    noBorder
                    allowFocus
                />
            );
        }

        return null;
    }, [stoneItems]);

    // ── Totals ────────────────────────────────────────────────────────────────
    const totals = useMemo(() => ({
        stonePcs: rows.reduce((sum, r) => sum + (parseInt(r.stonePcs) || 0), 0),
        // stoneWeight: rows.reduce((sum, r) => sum + (parseFloat(r.stoneWeight) || 0), 0),
        stoneAmount: rows.reduce((sum, r) => sum + (parseFloat(r.stoneAmount) || 0), 0),
    }), [rows]);

    const renderTotalCell = useCallback((col: ColumnDef) => {
        if (col.key === "stoneId") return <span style={{ fontSize: 11 }}>TOTAL</span>;
        if (col.key === "stonePcs") return <span style={{ fontSize: 11 }}>{totals.stonePcs}</span>;
        // if (col.key === "stoneWeight") return <span style={{ fontSize: 11 }}>{totals.stoneWeight.toFixed(3)}</span>;
        if (col.key === "stoneAmount") return <span style={{ fontSize: 11 }}>{totals.stoneAmount.toFixed(2)}</span>;
        return null;
    }, [totals]);

    // ── Save & close ──────────────────────────────────────────────────────────
    const handleSaveAndClose = useCallback(() => {
        // Touch all cells to surface errors
        const allTouched: Record<string, boolean> = {};
        rows.forEach((_, ri) => COLUMNS.forEach(c => { allTouched[`${ri}_${c.key}`] = true; }));
        setTouched(allTouched);

        const hasErrors = Object.keys(errors).length > 0;
        if (hasErrors) {
            toaster.create({ title: "Fix errors before saving", type: "error", duration: 2000 });
            return;
        }

        // Check weight limit (but in edit mode, allow saving)
        // Weight validation here is per-row; total weight validation happens below

        // Convert to format expected by parent
        const saveRows = rows
            .filter(r => r.stoneId && r.stoneId.trim() !== "")
            .map(({ __id, draftRowId, stoneId, stonePcs, stoneWeight, stoneUnit, stoneCalculation, stoneRate, stoneAmount }) => ({
                id: __id,
                draftRowId,
                stoneId,
                stonePcs: parseFloat(stonePcs) || 0,
                stoneWeight: parseFloat(stoneWeight) || 0,
                stoneUnit,
                stoneCalculation,
                stoneRate: parseFloat(stoneRate) || 0,
                stoneAmount: parseFloat(stoneAmount) || 0,
            }));

        onSave(saveRows);
        onClose();
    }, [rows, errors, onSave, onClose]);

    useGlobalKey("Escape", handleSaveAndClose, "stone-window");

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <Box p={2}>
            <HStack justify="center" mb={2}>
                <HStack gap={3} display='flex' alignItems='center'>
                    <Text fontSize="base" fontWeight="semibold">
                        Stone Entry
                    </Text>
                    <Text fontSize="2xs" color="gray.500">
                        Available:{" "}
                        <Text as="span" fontWeight="semibold" color={isOverWeight ? "red.500" : "green.600"}>
                            {remainingWeight.toFixed(3)}g
                        </Text>
                        {" / "}{Number(grsWeight).toFixed(3)}g
                    </Text>
                </HStack>
            </HStack>

            <ExcelGrid
                columns={COLUMNS}
                rows={rows}
                renderCell={renderCell}
                onCellChange={handleCellChange}
                onRowAdd={handleRowAdd}
                onRowDelete={handleRowDelete}
                errors={errors}
                touched={touched}
                showEnterNavigate
                showTotals
                showAddRow
                showDeleteRow
                renderTotalCell={renderTotalCell}
                maxVisibleRows={10}
                accentColor="#185FA5"
                initialFocusCell={{ rowIndex: 0, colKey: "stoneId" }}  // ✅ clean
            />

            <HStack justify="flex-end" gap={2} mt={4}>
                <Text
                    m={2}
                    fontSize="small"
                    fontWeight="500"
                    color={isOverWeight ? "red.500" : "inherit"}
                >
                    Used: {Number(totalUsedWeight).toFixed(3)} / {Number(grsWeight).toFixed(3)} g
                    {isOverWeight && " ⚠ Over limit!"}
                </Text>
                <Button colorPalette="blue" size="xs" onClick={handleSaveAndClose}>
                    Save &amp; Close
                </Button>
            </HStack>
        </Box>
    );
}