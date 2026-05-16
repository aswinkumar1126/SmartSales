"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
    Box,
    Text,
    Button,
    HStack,
} from "@chakra-ui/react";
import { SelectCombobox, SelectItem } from "@/components/ui/selectComboBox";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { toaster } from "@/components/ui/toaster";
import { useGlobalKey } from "@/components/key/useGlobalKey";
import ExcelGrid, { ColumnDef, RenderCellParams } from "@/component/table/ExcelGrid";
import { useSoftControlById } from "@/hooks/apiHooks/softControl/useSoftControl";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MiscChargeRow = {
    __id: string;
    draftRowId: string;
    chargeId:String;
    chargeName: string;
    amount: string; // keep as string — ExcelGrid is value-agnostic
    finalAmount:string;
};

type Props = {
    draftRowId: string;
    onClose: () => void;
    onSave: (rows: MiscChargeRow[]) => void;
    initialRows?: { id?: string; draftRowId?: string; chargeId:string; chargeName: string; amount: number ; finalAmount: string}[];
    chargeItems?: SelectItem[];
    otherChargesData?: any;
    pcs?: number
};

// ─── Column definitions ───────────────────────────────────────────────────────

const COLUMNS: ColumnDef[] = [
    { key: "chargeId", label: "MISCELLANEOUS", width: 120, required: true },
    { key: "amount", label: "AMOUNT", width: 80, align: "right", decimalScale: 2, required: true },
    { key: "finalAmount", label: "AMOUNT", width: 80, align: "right", decimalScale: 2, required: true , disabled :true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _uid = 0;
function uid() { return `mc_${++_uid}_${Date.now()}`; }

function emptyRow(draftRowId: string): MiscChargeRow {
    return { __id: uid(), chargeId : "" ,draftRowId, chargeName: "", amount: "" , finalAmount :"" };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OtherChargesWindow({
    draftRowId,
    onClose,
    onSave,
    initialRows = [],
    chargeItems = [],
    otherChargesData,
    pcs
}: Props) {


    const { data: SoftControl } = useSoftControlById('SA_HMC_FINALAMT');


    const isHmcFinalAmt = SoftControl?.CTLTEXT === "Y" ;

    // ── Rows — ExcelGrid is fully controlled ──────────────────────────────────
    const [rows, setRows] = useState<MiscChargeRow[]>(() => {
        if (initialRows.length > 0) {
            return initialRows.map(r => ({
                __id: r.id ?? uid(),
                draftRowId: r.draftRowId ?? draftRowId,
                chargeId : r.chargeId ?? "",
                chargeName: r.chargeName ?? "",
                amount: r.amount != null ? String(r.amount) : "",
                finalAmount: r.finalAmount != null ? String(r.finalAmount) : ""
            }));
        }
        return [emptyRow(draftRowId)];
    });

    // Sync when initialRows prop changes (e.g. modal re-opened for same row)
    const prevInitialRef = useRef("");
    useEffect(() => {
        const key = JSON.stringify(initialRows);
        if (key === prevInitialRef.current) return;
        prevInitialRef.current = key;

        if (initialRows.length > 0) {
            setRows(initialRows.map(r => ({
                __id: r.id ?? uid(),
                draftRowId: r.draftRowId ?? draftRowId,
                chargeId: r.chargeId ?? "",
                chargeName: r.chargeName ?? "",
                amount: r.amount != null ? String(r.amount) : "",
                finalAmount: r.finalAmount != null ? String(r.finalAmount) : ""
            })));
        } else {
            setRows([emptyRow(draftRowId)]);
        }
    }, [initialRows, draftRowId]);

    // ── Track which amounts were manually changed (by row index) ──────────────
    const [manuallyChangedAmounts, setManuallyChangedAmounts] = useState<Set<number>>(new Set());

    // ── Validation ────────────────────────────────────────────────────────────
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const errors = useMemo<Record<string, string>>(() => {
        const errs: Record<string, string> = {};
        rows.forEach((row, ri) => {
            if(row.chargeName){
                // if (!row.chargeName || row.chargeName.trim() === "")
                //     errs[`${ri}_chargeName`] = "Charge name is required";
                const amt = Number(row.amount);
                if (!row.amount || isNaN(amt) || amt < 0)
                    errs[`${ri}_amount`] = "Must be >= 0";
            }
        });
        return errs;
    }, [rows]);
    
    // Add this effect to re-derive finalAmount when enteredPieces changes
    // useEffect(() => {
    //     setRows(prev => prev.map(row => {
    //         const match = otherChargesData?.find(
    //             (item: any) => Number(item.chargeId) === Number(row.chargeId)
    //         );

    //         // ✅ Use same isHmc logic as handleCellChange
    //         const isHmc = String(match?.chargeName || "").trim().toUpperCase() === "HMC";

    //         const amt = Number(row.amount || 0);
    //         return {
    //             ...row,
    //             finalAmount: String(isHmc && isHmcFinalAmt ? amt * Number(pcs || 1) : amt)
    //         };
    //     }));
    // }, [pcs]); 
    // ── Cell change — fully controlled ────────────────────────────────────────
    const handleCellChange = useCallback(
        (ri: number, colKey: string, value: any) => {
            setRows(prev => {
                const next = [...prev];
                const updated = { ...next[ri], [colKey]: value };

                // ------------------------------------------------
                // Find selected charge
                // ------------------------------------------------
                const selectedChargeId =
                    colKey === "chargeId"
                        ? value
                        : updated.chargeId;

                console.log(selectedChargeId, 'selectedChargeId');

                const match = otherChargesData?.find(
                    (item: any) =>
                        Number(item.chargeId) === Number(selectedChargeId)
                );
                console.log(match, 'matching')


                // ------------------------------------------------
                // Check whether this charge is HMC
                // ------------------------------------------------
                const isHmc =

                    String(match?.chargeName || "")
                        .trim()
                        .toUpperCase() === "HMC"


                if (colKey === "chargeId") {
                    if (!value) {
                        // ✅ Charge cleared — reset both amount and finalAmount
                        updated.amount = "";
                        updated.finalAmount = "";
                        next[ri] = updated;
                        return next;
                    }
                    // ✅ Always overwrite amount when charge changes (not just when empty)
                    if (match?.chargeAmount != null) {
                        updated.amount = String(match.chargeAmount);
                        updated.chargeName = String(match?.chargeName);
                    } else {
                        updated.amount = ""; // charge has no default amount
                        updated.chargeName = String(match?.chargeName);
                    }
                }
                // ── Calculate final amount ──────────────────────────────────────────
                const amt = Number(
                    colKey === "amount"
                        ? value
                        : updated.amount || 0
                );

                updated.finalAmount = String(
                    isHmc && isHmcFinalAmt ? amt * Number(pcs || 1) : amt
                );

                next[ri] = updated;
                return next;
            });

            setTouched(prev => ({
                ...prev,
                [`${ri}_${colKey}`]: true
            }));
        },
        [otherChargesData, pcs]
    );


    // ── Row management ────────────────────────────────────────────────────────
    const handleRowAdd = useCallback(() => {
        setRows(prev => [...prev, emptyRow(draftRowId)]);
    }, [draftRowId]);

    const handleRowDelete = useCallback((ri: number) => {
        setRows(prev => {
            const next = prev.filter((_, i) => i !== ri);
            // Clean up manual changes tracking
            setManuallyChangedAmounts(prevMan => {
                const updated = new Set(prevMan);
                updated.delete(ri);
                return updated;
            });
            return next.length === 0 ? [emptyRow(draftRowId)] : next;
        });
    }, [draftRowId]);

    // ── Reset amount to default for a specific row ────────────────────────────
    const handleResetToDefault = useCallback((ri: number) => {
        setRows(prev => {
            const row = prev[ri];
            if (!row.chargeId) return prev;

            const match = otherChargesData?.find(
                (item: any) => Number(item.chargeId) === Number(row.chargeId)
            );

            if (match?.chargeAmount) {
                const next = [...prev];
                next[ri] = { ...next[ri], amount: String(match.chargeAmount) };

                setManuallyChangedAmounts(prevMan => {
                    const updated = new Set(prevMan);
                    updated.delete(ri);
                    return updated;
                });

                return next;
            }
            return prev;
        });
    }, [otherChargesData]);

    // ── renderCell — our own components, no wrappers ──────────────────────────
    const renderCell = useCallback((params: RenderCellParams) => {
        const { col, value, isEditing, isFocused, isError, errorMessage, onChange, onCommit, inputRef, row, rowIndex } = params;

        // ── chargeName — SelectCombobox ───────────────────────────────────────
        if (col.key === "chargeId") {
            return (
                <SelectCombobox
                    value={value}
                    items={chargeItems}
                    onChange={(val) => {
                        onChange(val);
                        if (val) onCommit(); // move to next cell on selection
                    }}
                    ref={inputRef}
                    // onEnter={onCommit}
                    rounded="sm"
                    placeholder="Select charge"
                />
            );
        }

        // ── amount — CapitalizedInput with reset button ───────────────────────
        if (col.key === "amount") {
            const isManuallyChanged = manuallyChangedAmounts.has(rowIndex);
            const hasChargeSelected = row.chargeName && row.chargeName.trim() !== "";

            // View mode — show formatted value with optional reset button
            if (!isEditing && !isFocused) {
                const n = parseFloat(value);
                return (
                    <div style={{
                        padding: "0 6px",
                        fontSize: 11,
                        textAlign: "right",
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: "4px"
                    }}>
                        <span>{isNaN(n) ? "—" : n.toFixed(2)}</span>
                        {isManuallyChanged && hasChargeSelected && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleResetToDefault(rowIndex);
                                }}
                                style={{
                                    fontSize: "9px",
                                    color: "#DD6B20",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "0 2px",
                                    textDecoration: "underline"
                                }}
                                title="Reset to default amount"
                            >
                                ↺
                            </button>
                        )}
                    </div>
                );
            }

           

            // Edit mode
            return (
                <div style={{ display: "flex", alignItems: "center", gap: "4px", width: "100%" }}>
                    <CapitalizedInput
                        field={col.key}
                        value={value}
                        type="number"
                        allowDecimal
                        decimalScale={2}
                        onChange={(_, v) => onChange(v)}
                        inputRef={inputRef}
                        // onEnter={onCommit}
                        size="xs"
                        rounded="sm"
                        noBorder
                        allowFocus
                    />
                    {isManuallyChanged && hasChargeSelected && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleResetToDefault(rowIndex);
                            }}
                            style={{
                                fontSize: "9px",
                                color: "#DD6B20",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: "0 2px",
                                whiteSpace: "nowrap"
                            }}
                            title="Reset to default amount"
                        >
                            Reset
                        </button>
                    )}
                </div>
            );
        }
        if (col.key === "finalAmount") {
            // View mode — show formatted value
            if (!isEditing && !isFocused) {
                const n = parseFloat(value);
                return (
                    <div style={{ padding: "0 6px", fontSize: 11, textAlign: "right", width: "100%" }}>
                        {isNaN(n) ? "—" : n.toFixed(2)}
                    </div>
                );
            }

            return (
                <CapitalizedInput
                    field={col.key}
                    value={value}
                    type="number"
                    allowDecimal
                    decimalScale={2}
                    onChange={(_, v) => onChange(v)}
                    inputRef={inputRef}
                    // onEnter={onCommit}
                    size="xs"
                    rounded="sm"
                    disabled
                />
            );
        }


        return null;
    }, [chargeItems, manuallyChangedAmounts, handleResetToDefault]);

    // ── Totals ────────────────────────────────────────────────────────────────
    const totalAmount = useMemo(
        () => rows.reduce((sum, r) => sum + (parseFloat(r.finalAmount) || 0), 0),
        [rows]
    );

    const renderTotalCell = useCallback((col: ColumnDef) => {
        if (col.key === "chargeName") return <span style={{ fontSize: 11 }}>TOTAL</span>;
        // if (col.key === "amount") return <span style={{ fontSize: 11 }}>{totalAmount.toFixed(2)}</span>;
        if (col.key === "finalAmount") return <span style={{ fontSize: 11 }}>{totalAmount.toFixed(2)}</span>;
        return null;
    }, [totalAmount]);

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

        const nonEmpty = rows.filter(r => r.chargeName && parseFloat(r.amount) >= 0);

        // Convert to the format expected by the parent component
        const saveRows = nonEmpty.map(({ __id, draftRowId,chargeId , chargeName, amount ,finalAmount }) => ({
            __id:__id,
            draftRowId,
            chargeId,
            chargeName,
            amount: String(parseFloat(amount)),
            finalAmount
        }));

        onSave(saveRows);
        onClose();
    }, [rows, errors, onSave, onClose]);

    useGlobalKey("Escape", handleSaveAndClose, "other-charges-window");

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <Box p={2} minW="420px">
            <HStack justify="center" mb={2}>
                <Text fontSize="smaller" fontWeight="semibold">
                    OTHER CHARGES DETAILS
                </Text>
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
                getRowStyle={(ri, row) => {
                    const isEmpty = !row.chargeName && !row.amount;
                    return isEmpty ? { opacity: 0.6 } : {};
                }}
                getHeaderStyle={(ri, row) => {
                    const isEmpty = !row.chargeName && !row.amount;
                    return isEmpty ? { opacity: 0.6 } : {};
                }}
                getCellStyle={(ri, col) => {
                    if (col.key === "amount" || col.key === "finalAmount") {
                        return { textAlign: "right" as const };
                    }
                    return {};
                }}
                initialFocusCell={{ rowIndex: 0, colKey: "chargeId" }}  // ✅ clean
                tranEditing={false}
            />

            <HStack justify="flex-end" gap={2} mt={3}>
                <Text fontSize="small" fontWeight="500">
                    Total: ₹{totalAmount.toFixed(2)}
                </Text>
                <Button colorPalette="blue" size="xs" onClick={handleSaveAndClose}>
                    Save &amp; Close
                </Button>
            </HStack>
        </Box>
    );
}