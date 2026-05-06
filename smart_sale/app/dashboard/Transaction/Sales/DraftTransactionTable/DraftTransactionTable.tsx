"use client";

import React, {
    useMemo, useCallback, useState, useEffect, useRef,
} from "react";
import {
    Box, Text, Button, Flex, Badge, HStack, Icon,
} from "@chakra-ui/react";
import { LuX } from "react-icons/lu";

import { issueColumns, saleColumns } from "../transactionForm/TransactionForm";
import { useStoneItems } from "@/hooks/apiHooks/item/useItems";
import StoneEnterMaster from "../StoneMaster/StoneEntryMaster";
import OtherChargesWindow from "../OtherCharges/OtherChargesWindow";
import { SelectCombobox } from "@/components/ui/selectComboBox";
import { useGlobalKey } from "@/components/key/useGlobalKey";
import { toaster } from "@/components/ui/toaster";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { TextareaField } from "@/components/ui/CapitalizesTextArea";
import { getIsTagEnabled, getIsBillModalEnabled } from "@/config/transaction/SalesConfig";
import SalesBillViewModal from "../SaleModal/SaleModal";
import { usePureGoldDataById } from "@/hooks/apiHooks/pureGoldMast/usePureGoldMastData";
import { ExcelGrid, ColumnDef, RenderCellParams } from "@/component/table/ExcelGrid";

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

const newRowId = () => `row-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

function recalcRow(row: Record<string, any>, isIssue: boolean) {
    const g = parseFloat(row.GRSWT) || 0;
    const s = parseFloat(row.STNWT) || 0;
    const touch = parseFloat(row.TOUCH) || 0;
    const wt = parseFloat(row.WT) || 0;
    const awt = parseFloat(row.AWT) || 0;
    const atouch = parseFloat(row.ATOUCH) || 0;

    row.NETWT = (g - s).toFixed(3);
    row.PUREWT = isIssue
        ? ((wt * touch) / 100).toFixed(3)
        : (((g - s) * touch) / 100).toFixed(3);
    row.APUREWT = ((awt * atouch) / 100).toFixed(3);
    return row;
}

function makeEmptyRow(formFields: FormField[], isIssue: boolean): Record<string, any> {
    const row: Record<string, any> = { __rowId: newRowId() };
    formFields.forEach((f) => { row[f.key] = f.defaultValue ?? ""; });
    row.WASTYPE = "TOUCH";
    row._stones = [];
    row._miscCharges = [];
    return recalcRow(row, isIssue);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DraftTransactionTable({
    rows,
    editingState,
    onEditRow,
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

    // ── Draft rows (local spreadsheet state) ──────────────────────────────────
    const [draftRows, setDraftRows] = useState<Record<string, any>[]>([]);
    const draftRowsRef = useRef(draftRows);
    useEffect(() => { draftRowsRef.current = draftRows; }, [draftRows]);

    const committedRowIdsRef = useRef<Set<string>>(new Set());
    const pendingParentCallRef = useRef<(() => void) | null>(null);
    const appliedPureIdRef = useRef<Record<string, string>>({});

    // ── Stone / misc modal state ───────────────────────────────────────────────
    const [stoneModalRowId, setStoneModalRowId] = useState<string | null>(null);
    const [miscModalRowId, setMiscModalRowId] = useState<string | null>(null);
    const [currentGRSWT, setCurrentGRSWT] = useState<number>(0);
    const [isStoneModalOpen, setIsStoneModalOpen] = useState(false);
    const [isMiscModalOpen, setIsMiscModalOpen] = useState(false);

    // ── Stone items ────────────────────────────────────────────────────────────
    const { data: stoneItemsData } = useStoneItems({ STUDDED: "Y" });
    const [stoneItemsCollection, setStoneItemCollection] = useState<{ label: string; value: string }[]>([]);
    useEffect(() => {
        if (!stoneItemsData) return;
        setStoneItemCollection(stoneItemsData.map((item: any) => ({
            label: item.itemName,
            value: item.itemId.toString(),
        })));
    }, [stoneItemsData]);

    // ── Tag input ──────────────────────────────────────────────────────────────
    const [tagNo, setTagNo] = useState<string>("");

    // ── Column / field setup ───────────────────────────────────────────────────
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
        return isTag
            ? ["TAGNO", "ITEMID", "PCS", "GRSWT", "STNWT", "NETWT", "WASTYPE", "WASPER",
                "WASTAGE", "TOUCH", "PUREWT", "HMC", "MC", "STNAMT", "DESCRIPTION"]
            : ["ITEMID", "PCS", "GRSWT", "STNWT", "NETWT", "WASTYPE", "WASPER",
                "WASTAGE", "TOUCH", "PUREWT", "HMC", "MC", "STNAMT", "DESCRIPTION"];
    }, [isIssue, isTag]);

    const baseColumns = isIssue ? issueColumns : saleColumns(isTag);
    const colMap = useMemo(() => new Map(baseColumns.map((c) => [c.key, c])), [baseColumns]);
    const tableCols = useMemo(
        () => orderedKeys.map((k) => colMap.get(k)).filter(Boolean) as any[],
        [orderedKeys, colMap]
    );

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
                disabled: col.disabled,
                ...("decimalScale" in col && typeof col.decimalScale === "number"
                    ? { decimalScale: col.decimalScale }
                    : {}),
            };

            if (col.key === "ITEMID" || col.key === "PUREID")
                return { ...base, type: "combobox", collection: itemsCollection || { items: [] }, isRequired: true };

            if (col.key === "WASTYPE")
                return { ...base, type: "select", collection: wastypecollection, isRequired: true, defaultValue: "TOUCH" };

            if (!isIssue && ["NETWT", "PUREWT"].includes(col.key))
                return { ...base, type: "calculated", disabled: true };

            if (isIssue && ["PUREWT", "APUREWT"].includes(col.key))
                return { ...base, type: "calculated", disabled: true };

            if (!isIssue && col.key === "STNAMT")
                return { ...base, type: "calculated", disabled: true };

            return base;
        });
    }, [tableCols, itemsCollection, isIssue, wastypecollection, numericFields]);

    // ── ExcelGrid column definitions ───────────────────────────────────────────
    const gridColumns = useMemo<ColumnDef[]>(() => {
        return formFields.map((f): ColumnDef => {
            const baseCol = tableCols.find((c) => c.key === f.key);
            return {
                key: f.key,
                label: f.label || f.key,
                width: baseCol?.width || 80,
                align: baseCol?.align || (f.type === "number" ? "right" : "left"),
                required: f.isRequired,
                decimalScale: f.decimalScale,
                computed: f.type === "calculated" || f.disabled === true,
                disabled: f.type === "calculated" || f.disabled === true,
            };
        });
    }, [formFields, tableCols]);

    // ── Sync parent rows → draftRows ──────────────────────────────────────────
    const parentRowsRef = useRef(rows);
    const isFirstSyncRef = useRef(true);
    const prevRowIdsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        parentRowsRef.current = rows;
        rows.forEach((r) => committedRowIdsRef.current.add(r.__rowId));

        // ── Case 1: First mount ───────────────────────────────────────────────
        if (isFirstSyncRef.current) {
            isFirstSyncRef.current = false;
            const converted = rows.map((r) => recalcRow({ ...r }, !!isIssue));
            if (converted.length === 0) converted.push(makeEmptyRow(formFields, !!isIssue));
            setDraftRows(converted);
            prevRowIdsRef.current = new Set(rows.map((r) => r.__rowId));
            return;
        }

        // ── Case 2: Transaction switch ────────────────────────────────────────
        const currentDraftIds = new Set(draftRowsRef.current.map((r) => r.__rowId));
        const hasOverlap = rows.some((r) => currentDraftIds.has(r.__rowId));
        if (!hasOverlap && rows.length > 0) {
            committedRowIdsRef.current = new Set();
            appliedPureIdRef.current = {};
            const converted = rows.map((r) => recalcRow({ ...r }, !!isIssue));
            if (converted.length === 0) converted.push(makeEmptyRow(formFields, !!isIssue));
            setDraftRows(converted);
            rows.forEach((r) => committedRowIdsRef.current.add(r.__rowId));
            prevRowIdsRef.current = new Set(rows.map((r) => r.__rowId));
            return;
        }

        // ── Case 3: Same transaction — Smart sync (replace existing or append new) ──
        // const newRows = rows.filter((r) => !prevRowIdsRef.current.has(r.__rowId));

        // if (newRows.length > 0) {
        //     setDraftRows((prev) => {
        //         const next = [...prev];

        //         newRows.forEach((newParentRow) => {
        //             // Check if this row already exists in draft
        //             const existingIndex = next.findIndex(r => r.__rowId === newParentRow.__rowId);

        //             if (existingIndex !== -1) {
        //                 // 🔥 REPLACE existing row (preserve local stones/misc charges)
        //                 // This handles user-created rows that parent added at wrong position
        //                 next[existingIndex] = recalcRow({
        //                     ...newParentRow,
        //                     _stones: next[existingIndex]._stones || [],
        //                     _miscCharges: next[existingIndex]._miscCharges || [],
        //                 }, !!isIssue);
        //             } else {
        //                 // 🔥 APPEND brand new row from external source (tag/bill)
        //                 next.push(recalcRow({ ...newParentRow }, !!isIssue));
        //             }

        //             committedRowIdsRef.current.add(newParentRow.__rowId);
        //         });

        //         // Clean up: Remove any rows that were deleted from parent
        //         const parentIds = new Set(rows.map(r => r.__rowId));
        //         const filteredNext = next.filter(row => {
        //             // Keep if: 1) In parent, OR 2) Not committed (still being edited)
        //             return parentIds.has(row.__rowId) || !committedRowIdsRef.current.has(row.__rowId);
        //         });

        //         if (filteredNext.length === 0) {
        //             return [makeEmptyRow(formFields, !!isIssue)];
        //         }
        //         return filteredNext;
        //     });
        // } else {
        //     // No new rows, but still need to remove rows deleted from parent
        //     setDraftRows((prev) => {
        //         const parentIds = new Set(rows.map(r => r.__rowId));
        //         const filtered = prev.filter(row => {
        //             return parentIds.has(row.__rowId) || !committedRowIdsRef.current.has(row.__rowId);
        //         });

        //         if (filtered.length === 0 && prev.length > 0) {
        //             return [makeEmptyRow(formFields, !!isIssue)];
        //         }
        //         return filtered;
        //     });
        // }

        prevRowIdsRef.current = new Set(rows.map((r) => r.__rowId));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows]);


    useEffect(() => {
        rows.forEach((r) => committedRowIdsRef.current.add(r.__rowId));
    }, [rows]);

    const prevTransactionTypeRef = useRef(transactionType);
    useEffect(() => {
        if (prevTransactionTypeRef.current !== transactionType) {
            prevTransactionTypeRef.current = transactionType;
            isFirstSyncRef.current = true;
        }
    }, [transactionType]);

    // ── initialFormData support (e.g. tag lookup populating a row) ────────────
    useEffect(() => {
        if (!initialFormData) return;
        const rowId = initialFormData.__rowId;

        setDraftRows((prev) => {
            const existsIdx = prev.findIndex((r) => r.__rowId === rowId);
            if (existsIdx >= 0) {
                // Update existing row
                const next = [...prev];
                next[existsIdx] = recalcRow({ ...next[existsIdx], ...initialFormData }, !!isIssue);
                return next;
            }
            // Append as new row
            return [...prev, recalcRow({ ...initialFormData }, !!isIssue)];
        });
    }, [initialFormData]);

    // ── Add empty row ──────────────────────────────────────────────────────────
    const handleAddRow = useCallback(() => {
        setDraftRows((prev) => [...prev, makeEmptyRow(formFields, !!isIssue)]);
    }, [formFields, isIssue]);

    // ── Auto-sync draftRows → parent store ────────────────────────────────────
    const lastSyncedRowsRef = useRef<Record<string, string>>({});

    // Keep a ref to the sync function so we can call it on unmount
    const syncToStoreRef = useRef<() => void>(() => { });

    const syncToStore = useCallback((rows: Record<string, any>[]) => {
        rows.forEach((row, rowIndex) => {
            const isMeaningful = !!(row.ITEMID || row.PUREID || row.WT || row.GRSWT);
            if (!isMeaningful) return;

            const isCommitted = committedRowIdsRef.current.has(row.__rowId);

            const { __rowId, ...syncableFields } = row;
            const rowHash = JSON.stringify(syncableFields);
            const lastHash = lastSyncedRowsRef.current[row.__rowId];
            const hasChanged = rowHash !== lastHash;

            if (!hasChanged) return;

            lastSyncedRowsRef.current[row.__rowId] = rowHash;

            if (isCommitted) {
                Object.keys(row).forEach((field) => {
                    if (field === "__rowId") return;
                    onUpdateRow(rowIndex, field, row[field]);
                });
            } else {
                committedRowIdsRef.current.add(row.__rowId);
                onAddRow(row);
            }
        });

        // Clean up hashes for deleted rows
        const currentIds = new Set(rows.map((r) => r.__rowId));
        Object.keys(lastSyncedRowsRef.current).forEach((id) => {
            if (!currentIds.has(id)) delete lastSyncedRowsRef.current[id];
        });
    }, [onUpdateRow, onAddRow]);

    // Keep ref always up to date so unmount cleanup uses latest version
    useEffect(() => {
        syncToStoreRef.current = () => syncToStore(draftRowsRef.current);
    });

    // ── Auto-sync on every draftRows change ───────────────────────────────────
    useEffect(() => {
        syncToStore(draftRowsRef.current);
    }, [draftRows]); // draftRows change triggers sync

    // ── Flush on unmount — catches the last entry ─────────────────────────────
    useEffect(() => {
        return () => {
            syncToStoreRef.current(); // runs with latest draftRows via ref
        };
    }, []); // empty deps — runs only on unmount

    // ── Manual sync ────────────────────────────────────────────────────────────
    const handleSyncAll = useCallback(() => {
        const current = draftRowsRef.current;
        current.forEach((row, rowIndex) => {
            const isMeaningful = !!(row.ITEMID || row.PUREID || row.WT || row.GRSWT );
            if (!isMeaningful) return;
            const isCommitted = committedRowIdsRef.current.has(row.__rowId);
    
            if (isCommitted) {
                Object.keys(row).forEach((field) => {
                    if (field.startsWith("_") || field === "__rowId") return;
                    onUpdateRow(rowIndex, field, row[field]);
                });
            } else {
                committedRowIdsRef.current.add(row.__rowId);
                onAddRow(row);
            }
        });
        toaster.create({
            title: "Synced",
            description: `${current.filter(r => !!(r.ITEMID || r.PUREID || r.WT || r.GRSWT)).length} row(s) synced`,
            type: "success",
            duration: 1500,
        });
    }, [onUpdateRow, onAddRow]);

    // ── Delete row ─────────────────────────────────────────────────────────────
    const handleDeleteRow = useCallback((rowIndex: number) => {
        const row = draftRowsRef.current[rowIndex];
        if (!row) return;

        const isBlank = !row.ITEMID && !row.PUREID && !row.WT && !row.GRSWT;
        if (!isBlank && !window.confirm("Delete this row?")) return;

        const wasCommitted = parentRowsRef.current.some((r) => r.__rowId === row.__rowId);
        const rowIdToRemove = row.__rowId;

        committedRowIdsRef.current.delete(rowIdToRemove);
        delete appliedPureIdRef.current[rowIdToRemove];

        setDraftRows((prev) => {
            const next = prev.filter((_, i) => i !== rowIndex);
            if (next.length === 0) return [makeEmptyRow(formFields, !!isIssue)];
            return next;
        });

        if (wasCommitted) {
            pendingParentCallRef.current = () => onRemoveRow(rowIdToRemove);
        }
    }, [formFields, isIssue, onRemoveRow]);

    // ── Cell change with stock validation (sales-specific) ────────────────────
    const handleCellChange = useCallback((rowIndex: number, colKey: string, value: any) => {
        let rowAfterUpdate: Record<string, any> | null = null;
        let shouldAdd = false;
        let shouldUpdate = false;

        setDraftRows((prev) => {
            const next = prev.map((r, i) => {
                if (i !== rowIndex) return r;
                const updated = { ...r, [colKey]: value };
                if (colKey === "WT") updated.AWT = value;
                recalcRow(updated, !!isIssue);
                return updated;
            });

            rowAfterUpdate = next[rowIndex];
            const isCommitted = committedRowIdsRef.current.has(rowAfterUpdate.__rowId);
            const isMeaningful = !!(rowAfterUpdate.ITEMID || rowAfterUpdate.PUREID
                || rowAfterUpdate.WT || rowAfterUpdate.GRSWT);

            if (isCommitted) {
                shouldUpdate = true;
            } else if (isMeaningful) {
                shouldAdd = true;
            }

            return next;
        });

        // Sales-specific: stock validation after ITEMID / PCS / GRSWT change
        if ((colKey === "PCS" || colKey === "NETWT") && transactionType === "SA") {
            pendingParentCallRef.current = () => {
                if (!rowAfterUpdate) return;
                const itemId = rowAfterUpdate.ITEMID;
                if (!itemId) {
                    if (shouldAdd && !committedRowIdsRef.current.has(rowAfterUpdate!.__rowId)) {
                        committedRowIdsRef.current.add(rowAfterUpdate!.__rowId);
                        onAddRow(rowAfterUpdate);
                    } else if (shouldUpdate) {
                        onUpdateRow(rowIndex, colKey, value);
                    }
                    return;
                }

                const availablePieces = getAvailablePieces?.(itemId, {
                    excludeRowId: committedRowIdsRef.current.has(rowAfterUpdate!.__rowId)
                        ? rowAfterUpdate!.__rowId : undefined,
                    isEditing: committedRowIdsRef.current.has(rowAfterUpdate!.__rowId),
                    originalPieces: Number(rowAfterUpdate!._originalPieces) || 0,
                    transactionTypeCode: transactionType,
                }) ?? null;

                if (availablePieces !== null && colKey === "PCS" && Number(value) > availablePieces) {
                    toaster.create({
                        title: "Insufficient Stock",
                        description: `Requested ${value} pcs exceeds available ${availablePieces} pcs`,
                        type: "error",
                    });
                    return;
                }

                const availableWeight = getAvailableWeight?.(itemId, {
                    excludeRowId: committedRowIdsRef.current.has(rowAfterUpdate!.__rowId)
                        ? rowAfterUpdate!.__rowId : undefined,
                    isEditing: committedRowIdsRef.current.has(rowAfterUpdate!.__rowId),
                    originalWeight: Number(rowAfterUpdate!._originalNetwt) || 0,
                    transactionTypeCode: transactionType,
                }) ?? null;

                const netwt = parseFloat(rowAfterUpdate!.NETWT) || 0;
                if (availableWeight !== null && netwt > availableWeight) {
                    toaster.create({
                        title: "Insufficient Stock",
                        description: `Net weight ${netwt.toFixed(3)}g exceeds available ${availableWeight.toFixed(3)}g`,
                        type: "error",
                    });
                    return;
                }

                if (shouldAdd && !committedRowIdsRef.current.has(rowAfterUpdate!.__rowId)) {
                    committedRowIdsRef.current.add(rowAfterUpdate!.__rowId);
                    onAddRow(rowAfterUpdate);
                } else if (shouldUpdate) {
                    onUpdateRow(rowIndex, colKey, value);
                }
            };
        } else {
            pendingParentCallRef.current = () => {
                if (!rowAfterUpdate) return;
                if (shouldAdd && !committedRowIdsRef.current.has(rowAfterUpdate!.__rowId)) {
                    committedRowIdsRef.current.add(rowAfterUpdate!.__rowId);
                    onAddRow(rowAfterUpdate);
                } else if (shouldUpdate) {
                    onUpdateRow(rowIndex, colKey, value);
                }
            };
        }
    }, [isIssue, onAddRow, onUpdateRow, transactionType, getAvailablePieces, getAvailableWeight]);

    // ── Flush pending parent calls after every render ─────────────────────────
    useEffect(() => {
        if (pendingParentCallRef.current) {
            const call = pendingParentCallRef.current;
            pendingParentCallRef.current = null;
            call();
        }
    });

    // ── Pure gold data for issue rows ──────────────────────────────────────────
    const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
    const activeRowPureId = activeRowIndex !== null ? draftRows[activeRowIndex]?.PUREID : undefined;
    const activeRowId = activeRowIndex !== null ? draftRows[activeRowIndex]?.__rowId : undefined;
    const { data: pureStockData } = usePureGoldDataById(activeRowPureId);

    useEffect(() => {
        if (!pureStockData || activeRowIndex === null || !activeRowId || !activeRowPureId) return;

        const key = `${activeRowId}::${activeRowPureId}`;
        if (appliedPureIdRef.current[activeRowId] === key) return;
        appliedPureIdRef.current[activeRowId] = key;

        const rowIndex = activeRowIndex;
        const touch = pureStockData.actualTouch;

        setDraftRows((prev) => {
            const next = [...prev];
            const row = { ...next[rowIndex] };
            row.TOUCH = touch;
            row.ATOUCH = touch;
            recalcRow(row, !!isIssue);
            next[rowIndex] = row;
            return next;
        });

        const wasCommitted = committedRowIdsRef.current.has(activeRowId);
        if (wasCommitted) {
            pendingParentCallRef.current = () => {
                onUpdateRow(rowIndex, "TOUCH", touch);
                onUpdateRow(rowIndex, "ATOUCH", touch);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pureStockData]);

    // ── Stone modal ────────────────────────────────────────────────────────────
    const handleOpenStoneModal = useCallback((rowId: string, grsWeight: number) => {
        if (!grsWeight || grsWeight <= 0) {
            toaster.create({ title: "Enter GRSWT first", type: "warning" });
            return;
        }
        setStoneModalRowId(rowId);
        setCurrentGRSWT(grsWeight);
        setIsStoneModalOpen(true);
    }, []);

    const stoneModalRow = useMemo(
        () => draftRows.find((r) => r.__rowId === stoneModalRowId),
        [draftRows, stoneModalRowId]
    );
    const stoneModalInitialRows = stoneModalRow?._stones || [];

    // ── Misc modal ─────────────────────────────────────────────────────────────
    const handleOpenMiscModal = useCallback((rowId: string) => {
        setMiscModalRowId(rowId);
        setIsMiscModalOpen(true);
    }, []);

    const miscModalRow = useMemo(
        () => draftRows.find((r) => r.__rowId === miscModalRowId),
        [draftRows, miscModalRowId]
    );
    const otherChargesInitialRows = miscModalRow?._miscCharges || [];

    // ── Tag lookup ─────────────────────────────────────────────────────────────
    const handleTagNoKeyDown = async () => {
        if (!tagNo) return;
        try {
            await onTagNoLookup?.(tagNo);
            setTagNo("");
        } catch (error) {
            toaster.create({ title: "Error", description: "Failed to process tag", type: "error" });
        }
    };

    // ── Totals row renderer ────────────────────────────────────────────────────
    const renderTotalCell = useCallback((col: ColumnDef, gridRows: Record<string, any>[]) => {
        const numericTotalKeys = isIssue
            ? ["WT", "AWT", "PUREWT", "APUREWT"]
            : ["PCS", "GRSWT", "STNWT", "NETWT", "WASTAGE", "PUREWT", "HMC", "MC", "STNAMT"];
        if (!numericTotalKeys.includes(col.key)) return null;
        const sum = gridRows.reduce((acc, r) => acc + (parseFloat(r[col.key]) || 0), 0);
        return (
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
                {sum.toFixed(col.decimalScale ?? 2)}
            </span>
        );
    }, [isIssue]);

    // ── Cell renderer ──────────────────────────────────────────────────────────
    const renderCell = useCallback((params: RenderCellParams) => {
        const { row, col, value, isEditing, isFocused, onChange, onCommit, inputRef } = params;
        const field = formFields.find((f) => f.key === col.key);
        if (!field) return <span style={{ padding: "0 4px", fontSize: 11 }}>{value ?? ""}</span>;

        // ── Computed / read-only ───────────────────────────────────────────────
        if (col.computed || col.disabled) {
            let displayValue = value ?? "";
            if (col.decimalScale) displayValue = Number(value || 0).toFixed(col.decimalScale);
            return (
                <span style={{
                    padding: "0 6px", fontSize: 11, color: "#555",
                    width: "100%", display: "block", textAlign: col.align || "left",
                }}>
                    {displayValue}
                </span>
            );
        }

        // ── STNWT — opens stone modal on focus ────────────────────────────────
        if (col.key === "STNWT") {
            const stonesCount = (row._stones || []).length;
            return (
                <div
                    style={{ display: "flex", alignItems: "center", width: "100%", padding: "0 2px" }}
                    onFocus={() => handleOpenStoneModal(row.__rowId, parseFloat(row.GRSWT) || 0)}
                >
                    <CapitalizedInput
                        field={col.key}
                        value={value || ""}
                        onChange={(_, v) => onChange(v)}
                        type="number"
                        isCapitalized={false}
                        size="xs"
                        rounded="sm"
                        decimalScale={field.decimalScale}
                        inputRef={inputRef}
                        onEnter={onCommit}
                        noBorder
                    />
                    {stonesCount > 0 && (
                        <span style={{ fontSize: 10, color: "#805AD5", flexShrink: 0, paddingRight: 2 }}>💎</span>
                    )}
                </div>
            );
        }

        // ── HMC — opens other charges modal on focus ──────────────────────────
        if (col.key === "HMC") {
            const chargesCount = (row._miscCharges || []).length;
            return (
                <div
                    style={{ display: "flex", alignItems: "center", width: "100%", padding: "0 2px" }}
                    onFocus={() => handleOpenMiscModal(row.__rowId)}
                >
                    <CapitalizedInput
                        field={col.key}
                        value={value || ""}
                        onChange={(_, v) => onChange(v)}
                        type="number"
                        isCapitalized={false}
                        size="xs"
                        rounded="sm"
                        decimalScale={2}
                        inputRef={inputRef}
                        onEnter={onCommit}
                        noBorder
                    />
                    {chargesCount > 0 && (
                        <span style={{ fontSize: 10, color: "#C05621", flexShrink: 0, paddingRight: 2 }}>📋</span>
                    )}
                </div>
            );
        }

        // ── STNAMT — derived from stones ──────────────────────────────────────
        if (col.key === "STNAMT") {
            const stonesTotal = (row._stones || []).reduce(
                (s: number, st: any) => s + (Number(st.stoneAmount) || 0), 0
            );
            return (
                <span style={{
                    padding: "0 6px", fontSize: 11, color: "#333",
                    width: "100%", display: "block", textAlign: "right",
                }}>
                    {stonesTotal > 0 ? stonesTotal.toFixed(2) : value || ""}
                </span>
            );
        }

        // ── DESCRIPTION ───────────────────────────────────────────────────────
        if (col.key === "DESCRIPTION") {
            return (
                <TextareaField
                    value={value || ""}
                    field="DESCRIPTION"
                    onChange={(_, v) => onChange(v)}
                    onEnter={onCommit}
                    mode="dialog"
                    rows={3}
                    dialogInputRef={inputRef}
                    disable={false}
                />
            );
        }

        // ── TAGNO — read-only (filled by tag lookup) ──────────────────────────
        if (col.key === "TAGNO") {
            return (
                <CapitalizedInput
                    field={col.key}
                    value={value || ""}
                    onChange={(_, v) => onChange(v)}
                    type="text"
                    isCapitalized
                    size="xs"
                    rounded="sm"
                    inputRef={inputRef}
                    onEnter={onCommit}
                    noBorder
                    disabled
                />
            );
        }

        // ── ITEMID / PUREID combobox ───────────────────────────────────────────
        if (col.key === "ITEMID" || col.key === "PUREID") {
            const items = field.collection?.items || [];
            if (!isEditing && !isFocused) {
                const item = items.find((i) => i.value === value?.toString());
                return (
                    <span style={{
                        padding: "0 6px", fontSize: 11, overflow: "hidden",
                        textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block",
                    }}>
                        {item?.label || value || ""}
                    </span>
                );
            }
            return (
                <SelectCombobox
                    value={value || ""}
                    onChange={(v) => { onChange(v); if (v) onCommit(); }}
                    items={items}
                    placeholder={field.placeholder || `Select ${field.label}`}
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    rounded="sm"
                    disable={false}
                    onEnter={onCommit}
                />
            );
        }

        // ── TOUCH in issue mode ────────────────────────────────────────────────
        if (isIssue && col.key === "TOUCH") {
            return (
                <CapitalizedInput
                    field={col.key}
                    value={value || ""}
                    onChange={(_, v) => onChange(v)}
                    type="number"
                    isCapitalized
                    size="xs"
                    rounded="sm"
                    decimalScale={field.decimalScale}
                    inputRef={inputRef}
                    onEnter={onCommit}
                    noBorder
                />
            );
        }

        // ── Default number / text ──────────────────────────────────────────────
        return (
            <CapitalizedInput
                field={col.key}
                value={value || ""}
                onChange={(_, v) => onChange(v)}
                type={field.type === "number" ? "number" : "text"}
                isCapitalized={field.type !== "number"}
                size="xs"
                rounded="sm"
                decimalScale={field.decimalScale}
                inputRef={inputRef}
                onEnter={onCommit}
                noBorder
            />
        );
    }, [formFields, isIssue, handleOpenStoneModal, handleOpenMiscModal]);

    // ── Colors ─────────────────────────────────────────────────────────────────
   

    const TYPE_COLORS: Record<string, string> = {
        SA: "#b7fff1", SR: "#ffc4c4", IS: "#ffd9a4", RE: "#ffcafb",
    };
    const accentColor = {
        SA: "#2F855A", SR: "#C53030", IS: "#DD6B20", RE: "#c729ba",
    }[transactionType ?? ""] ?? "#185FA5";

    const showTag = getIsTagEnabled(transactionType);
    const showBill = getIsBillModalEnabled(transactionType);
    const { showBillModal, handleBillShow } = onSaleReturnModal;

    useGlobalKey("Escape", () => setIsMiscModalOpen(false), "close-modal");

    const committedRows = draftRows.filter((r) => !!(r.ITEMID || r.PUREID || r.WT || r.GRSWT || r.PCS));

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <Box display="flex" flexDirection="column" gap={0}>
            {/* ── Header bar ──────────────────────────────────────────────── */}
            <Flex
                justifyContent="space-between" alignItems="center"
                px={2} py={1} bg="#FFF" color="#222" rounded="md"
                borderWidth="1px" borderColor={theme?.colors?.borderColor || "#CBD5E0"}
            >
                <HStack gap={2}>
                    <Text fontSize="xs" fontWeight="semibold" color={theme?.colors?.primaryText || "#1a202c"}>
                        {transactionTitle || "Transaction"} Items
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

                    {showBill && (
                        <Button
                            size="2xs" bg="blue.subtle"
                            color={theme.colors.primaryText}
                            onClick={() => handleBillShow()}
                        >
                            Bills 📄
                        </Button>
                    )}

                    <Badge
                        colorPalette={committedRows.length > 0 ? "green" : "gray"}
                        variant="subtle" fontSize="2xs" px={2}
                    >
                        {committedRows.length} item{committedRows.length !== 1 ? "s" : ""}
                    </Badge>

                    <Button
                        size="2xs" colorPalette="blue" variant="subtle" fontSize="2xs"
                        onClick={handleSyncAll} title="Sync all local changes to store"
                    >
                        ↑ Sync
                    </Button>
                </HStack>

                {!isEditing && (
                    <Button
                        size="2xs" colorPalette="red" variant="outline" fontSize="2xs"
                        onClick={() => {
                            onClear?.();
                            setDraftRows([makeEmptyRow(formFields, !!isIssue)]);
                        }}
                    >
                        <Icon as={LuX} boxSize={2} /> Clear All
                    </Button>
                )}
            </Flex>

            {/* ── ExcelGrid ───────────────────────────────────────────────── */}
            <Box
                bg={TYPE_COLORS[transactionType ?? ""] || "#FFF"}
                borderWidth="1px"
                borderColor={theme?.colors?.borderColor || "#CBD5E0"}
                borderRadius="md"
                overflow="hidden"
            >
                <ExcelGrid
                    columns={gridColumns}
                    rows={draftRows}
                    renderCell={renderCell}
                    onCellChange={handleCellChange}
                    onRowAdd={handleAddRow}
                    onRowDelete={handleDeleteRow}
                    onActiveChange={(coord) => {
                        setActiveRowIndex(coord?.rowIndex ?? null);
                    }}
                    errors={{}}
                    touched={{}}
                    showTotals={committedRows.length > 0}
                    showAddRow
                    showDeleteRow
                    maxVisibleRows={5}
                    accentColor={accentColor}
                    renderTotalCell={renderTotalCell}
                    getRowStyle={(ri, row) => {
                        const isEmpty = !row.ITEMID && !row.PUREID && !row.WT && !row.GRSWT;
                        return isEmpty ? { opacity: 0.6 } : {};
                    }}
                    getHeaderStyle={(ri, row) => {
                        const isEmpty = !row.ITEMID && !row.PUREID && !row.WT && !row.GRSWT;
                        return isEmpty ? { opacity: 0.6 } : {};
                    }}
                />
            </Box>

            {/* ── Stone modal ──────────────────────────────────────────────── */}
            {isStoneModalOpen && stoneModalRowId && (
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
                            onClose={() => setIsStoneModalOpen(false)}
                            draftRowId={stoneModalRowId}
                            initialRows={stoneModalInitialRows}
                            onSave={(stoneRows) => {
                                const updatedStones = stoneRows.map((s) => ({
                                    ...s, draftRowId: stoneModalRowId,
                                }));
                                const stoneWtTotal = updatedStones.reduce((sum, r) => sum + r.stoneWeight, 0);
                                const stnAmtTotal = updatedStones.reduce((sum, r) => sum + r.stoneAmount, 0);

                                const stoneRowIndex = draftRowsRef.current.findIndex(
                                    (x) => x.__rowId === stoneModalRowId
                                );
                                const stoneWasCommitted = parentRowsRef.current.some(
                                    (pr) => pr.__rowId === stoneModalRowId
                                );

                                setDraftRows((prev) => prev.map((r) => {
                                    if (r.__rowId !== stoneModalRowId) return r;
                                    return recalcRow({
                                        ...r,
                                        _stones: updatedStones,
                                        STNWT: stoneWtTotal.toFixed(3),
                                        STNAMT: stnAmtTotal.toFixed(2),
                                    }, !!isIssue);
                                }));

                                if (stoneWasCommitted && stoneRowIndex >= 0) {
                                    pendingParentCallRef.current = () => {
                                        onUpdateRow(stoneRowIndex, "STNWT", stoneWtTotal.toFixed(3));
                                        onUpdateRow(stoneRowIndex, "STNAMT", stnAmtTotal.toFixed(2));
                                        onUpdateRow(stoneRowIndex, "_stones", updatedStones);
                                    };
                                }

                                setIsStoneModalOpen(false);
                                toaster.create({
                                    title: "Stones Updated",
                                    description: `Total stone weight: ${stoneWtTotal.toFixed(3)}g`,
                                    type: "success",
                                    duration: 2000,
                                });
                            }}
                            stoneItems={stoneItemsCollection}
                        />
                    </Box>
                </Box>
            )}

            {/* ── Misc / Other-charges modal ───────────────────────────────── */}
            {isMiscModalOpen && miscModalRowId && (
                <Box
                    position="fixed" top={0} left={0} right={0} bottom={0}
                    bg="rgba(0,0,0,0.5)" zIndex={100}
                    display="flex" alignItems="center" justifyContent="center"
                    onClick={() => setIsMiscModalOpen(false)}
                >
                    <Box
                        bg={theme?.colors?.formColor || "white"} borderRadius="lg"
                        maxW="600px" width="100%" maxH="90vh" overflow="auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <OtherChargesWindow
                            draftRowId={miscModalRowId}
                            onClose={() => setIsMiscModalOpen(false)}
                            initialRows={otherChargesInitialRows}
                            onSave={(chargeRows) => {
                                const updatedCharges = chargeRows.map((c) => ({
                                    ...c, draftRowId: miscModalRowId,
                                }));
                                const total = updatedCharges.reduce(
                                    (sum, c) => sum + (Number(c.amount) || 0), 0
                                );

                                const miscRowIndex = draftRowsRef.current.findIndex(
                                    (x) => x.__rowId === miscModalRowId
                                );
                                const miscWasCommitted = parentRowsRef.current.some(
                                    (pr) => pr.__rowId === miscModalRowId
                                );

                                setDraftRows((prev) => prev.map((r) => {
                                    if (r.__rowId !== miscModalRowId) return r;
                                    return { ...r, _miscCharges: updatedCharges, HMC: total.toFixed(2) };
                                }));

                                if (miscWasCommitted && miscRowIndex >= 0) {
                                    pendingParentCallRef.current = () => {
                                        onUpdateRow(miscRowIndex, "HMC", total.toFixed(2));
                                        onUpdateRow(miscRowIndex, "_miscCharges", updatedCharges);
                                    };
                                }

                                toaster.create({
                                    title: "Charges Updated",
                                    description: `Total charges: Rs.${total.toFixed(2)}`,
                                    type: "success",
                                    duration: 2000,
                                });
                                setIsMiscModalOpen(false);
                            }}
                            chargeItems={otherChargesList}
                            otherChargesData={otherChargesData}
                        />
                    </Box>
                </Box>
            )}

            {/* ── Sales bill modal ─────────────────────────────────────────── */}
            <SalesBillViewModal
                isOpen={showBillModal}
                onClose={handleBillShow}
                billParams={onSaleReturnModal.billParams}
                onBillParamChange={onSaleReturnModal.onBillParamChange}
                billDetails={onSaleReturnModal.billDetails}
                loading={onSaleReturnModal.loading}
            />
        </Box>
    );
}