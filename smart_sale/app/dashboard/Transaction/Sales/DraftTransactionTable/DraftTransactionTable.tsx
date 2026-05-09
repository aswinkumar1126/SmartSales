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
import { useSaleTransactionStore } from "@/store/sales/useSaleTransactionStore";
import { useTouchByFilter } from "@/hooks/apiHooks/touch/useTouchMastData";

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
    onUpdateRow: (rowId: string, field: string, value: any) => void;
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

const newRowId = () => `row-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

function recalcRow(row: Record<string, any>, isIssue: boolean) {
    const g = parseFloat(row.GRSWT) || 0;
    const s = parseFloat(row.STNWT) || 0;
    const touch = parseFloat(row.TOUCH) || 0;
    const wt = parseFloat(row.WT) || 0;
    const awt = parseFloat(row.AWT) || 0;
    const atouch = parseFloat(row.ATOUCH) || 0;
    const calMode = row.CAL_MODE || "NETWT";

    row.NETWT = (g - s).toFixed(3);

    const baseWt = calMode === "NETWT" ? (g - s) : g;

    row.PUREWT = isIssue
        ? ((wt * touch) / 100).toFixed(3)
        : ((baseWt * touch) / 100).toFixed(3);

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

export default function DraftTransactionTable({
    rows,
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
    otherChargesList,
    otherChargesData,
    getAvailablePieces,
    isTag,
    handleTagChange,
    onTagNoLookup,
    acCode,
    onSaleReturnModal,
}: DraftTransactionTableProps) {

    const [draftRows, setDraftRows] = useState<Record<string, any>[]>([]);
    const draftRowsRef = useRef(draftRows);
    useEffect(() => { draftRowsRef.current = draftRows; }, [draftRows]);

    const committedRowIdsRef = useRef<Set<string>>(new Set());
    const syncedRowIdsRef = useRef<Set<string>>(new Set()); // Track which rows are synced to parent
    const appliedPureIdRef = useRef<Record<string, string>>({});
    const appliedItemIdRef = useRef<Record<string, string>>({});
    const touchNotFoundRef = useRef<Set<string>>(new Set());
    const lastAppliedTouchRef = useRef<Record<string, string>>({});
    const lastAppliedPureRef = useRef<Record<string, string>>({});

    const [stoneModalRowId, setStoneModalRowId] = useState<string | null>(null);
    const [miscModalRowId, setMiscModalRowId] = useState<string | null>(null);
    const [currentGRSWT, setCurrentGRSWT] = useState<number>(0);
    const [isStoneModalOpen, setIsStoneModalOpen] = useState(false);
    const [stoneModalInitialRows, setStoneModalInitialRows] = useState<any[]>([]);
    const [isMiscModalOpen, setIsMiscModalOpen] = useState(false);

    const { data: stoneItemsData } = useStoneItems({ STUDDED: "Y" });
    const [stoneItemsCollection, setStoneItemCollection] = useState<{ label: string; value: string }[]>([]);
    useEffect(() => {
        if (!stoneItemsData) return;
        setStoneItemCollection(stoneItemsData.map((item: any) => ({
            label: item.itemName,
            value: item.itemId.toString(),
        })));
    }, [stoneItemsData]);

    const [tagNo, setTagNo] = useState<string>("");

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
            if (!isIssue && col.key === "TOUCH" && transactionType === "SA")
                return { ...base, disabled: true };

            return base;
        });
    }, [tableCols, itemsCollection, isIssue, wastypecollection, numericFields, transactionType]);

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

    // ── Sync to parent function (immediate, called directly) ──────────────────
    const syncRowToParent = useCallback((row: Record<string, any>) => {
        const isMeaningful = !!(row.ITEMID || row.PUREID || row.WT || row.GRSWT);
        if (!isMeaningful) return;

        const isSynced = syncedRowIdsRef.current.has(row.__rowId);

        if (isSynced) {
            // Update existing
            Object.keys(row).forEach((field) => {
                if (field === "__rowId" || field.startsWith("_")) return;
                onUpdateRow(row.__rowId, field, row[field]);
            });
            // Sync meta fields
            if (row._stones !== undefined) onUpdateRow(row.__rowId, "_stones", row._stones);
            if (row._miscCharges !== undefined) onUpdateRow(row.__rowId, "_miscCharges", row._miscCharges);
        } else {
            // Add new
            syncedRowIdsRef.current.add(row.__rowId);
            committedRowIdsRef.current.add(row.__rowId);
            onAddRow(row);
        }
    }, [onUpdateRow, onAddRow]);

    // ── Sync parent rows → draftRows ─────────────────────────────────────────────
    const parentRowsRef = useRef(rows);
    const isInitializedRef = useRef(false);

    useEffect(() => {
        parentRowsRef.current = rows;

        // ── Initial load ──────────────────────────────────────────────────────────
        if (!isInitializedRef.current) {
            isInitializedRef.current = true;
            rows.forEach((r) => {
                syncedRowIdsRef.current.add(r.__rowId);
                committedRowIdsRef.current.add(r.__rowId);
            });
            const converted = rows.length > 0
                ? rows.map((r) => recalcRow({ ...r }, !!isIssue))
                : [makeEmptyRow(formFields, !!isIssue)];
            setDraftRows(converted);
            return;
        }

        // ── Detect transaction switch ─────────────────────────────────────────────
        const currentDraftIds = new Set(draftRowsRef.current.map((r) => r.__rowId));
        const hasOverlap = rows.some((r) => currentDraftIds.has(r.__rowId));
        const isTransactionSwitch = !hasOverlap && rows.length > 0;

        if (isTransactionSwitch) {
            syncedRowIdsRef.current = new Set();
            committedRowIdsRef.current = new Set();
            appliedPureIdRef.current = {};
            const converted = rows.map((r) => recalcRow({ ...r }, !!isIssue));
            const final = converted.length === 0 ? [makeEmptyRow(formFields, !!isIssue)] : converted;
            rows.forEach((r) => {
                syncedRowIdsRef.current.add(r.__rowId);
                committedRowIdsRef.current.add(r.__rowId);
            });
            setDraftRows(final);
            return;
        }

        // ── Incremental sync: merge parent changes into draft ────────────────────
        // Only pull in rows that are NOT locally dirty (i.e. not yet committed/new)
        setDraftRows((prev) => {
            const parentMap = new Map(rows.map((r) => [r.__rowId, r]));
            const localMap = new Map(prev.map((r) => [r.__rowId, r]));

            const next: Record<string, any>[] = [];

            prev.forEach((localRow) => {
                if (parentMap.has(localRow.__rowId)) {
                    // Row exists in both — local edits win, but pull parent-only fields
                    next.push(recalcRow(
                        { ...parentMap.get(localRow.__rowId)!, ...localRow },
                        !!isIssue
                    ));
                } else {
                    // Keep uncommitted local rows; drop committed rows deleted externally
                    const isUncommitted = !committedRowIdsRef.current.has(localRow.__rowId);
                    if (isUncommitted) next.push(localRow);
                }
            });

            // Pull in rows that appeared externally (e.g. initialFormData load)
            rows.forEach((r) => {
                if (!localMap.has(r.__rowId)) {
                    next.push(recalcRow({ ...r }, !!isIssue));
                    syncedRowIdsRef.current.add(r.__rowId);
                    committedRowIdsRef.current.add(r.__rowId);
                }
            });

            return next.length === 0 ? [makeEmptyRow(formFields, !!isIssue)] : next;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows]); // intentionally broad — we want to react to all parent changes

    // ── Reset on transaction type change ─────────────────────────────────────────
    const prevTransactionTypeRef = useRef(transactionType);
    useEffect(() => {
        if (prevTransactionTypeRef.current !== transactionType) {
            prevTransactionTypeRef.current = transactionType;
            isInitializedRef.current = false; // next rows effect = fresh init
            syncedRowIdsRef.current = new Set();
            committedRowIdsRef.current = new Set();
            appliedPureIdRef.current = {};
            appliedItemIdRef.current = {};
            touchNotFoundRef.current = new Set();
            lastAppliedTouchRef.current = {};
            lastAppliedPureRef.current = {};
        }
    }, [transactionType]);

    // ── Handle initialFormData ────────────────────────────────────────────────────
    useEffect(() => {
        if (!initialFormData?.__rowId) return;
        const rowId = initialFormData.__rowId;
        setDraftRows((prev) => {
            const existsIdx = prev.findIndex((r) => r.__rowId === rowId);
            if (existsIdx >= 0) {
                const next = [...prev];
                next[existsIdx] = recalcRow({ ...next[existsIdx], ...initialFormData }, !!isIssue);
                return next;
            }
            const newRow = recalcRow({ ...initialFormData }, !!isIssue);
            syncedRowIdsRef.current.add(newRow.__rowId);
            committedRowIdsRef.current.add(newRow.__rowId);
            return [...prev, newRow];
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialFormData]);

    // ── Add empty row ─────────────────────────────────────────────────────────────
    const handleAddRow = useCallback(() => {
        setDraftRows((prev) => [...prev, makeEmptyRow(formFields, !!isIssue)]);
    }, [formFields, isIssue]);


    const handleDeleteRow = useCallback((rowIndex: number) => {
        const row = draftRowsRef.current[rowIndex];
        if (!row) return;

        const isBlank = !row.ITEMID && !row.PUREID && !row.WT && !row.GRSWT;
        if (!isBlank && !window.confirm("Delete this row?")) return;

        const wasSynced = syncedRowIdsRef.current.has(row.__rowId);
        const rowIdToRemove = row.__rowId;

        syncedRowIdsRef.current.delete(rowIdToRemove);
        committedRowIdsRef.current.delete(rowIdToRemove);
        delete appliedPureIdRef.current[rowIdToRemove];
        delete appliedItemIdRef.current[rowIdToRemove];
        touchNotFoundRef.current.delete(rowIdToRemove);
        delete lastAppliedTouchRef.current[rowIdToRemove];
        delete lastAppliedPureRef.current[rowIdToRemove];

        setDraftRows((prev) => {
            const next = prev.filter((_, i) => i !== rowIndex);
            if (next.length === 0) return [makeEmptyRow(formFields, !!isIssue)];
            return next;
        });

        if (wasSynced) {
            onRemoveRow(rowIdToRemove);
        }
    }, [formFields, isIssue, onRemoveRow]);

    // ── Cell change ───────────────────────────────────────────────────────────────
    const handleCellChange = useCallback((rowIndex: number, colKey: string, value: any) => {
        // Reset touch/pure guards on item change
        if (colKey === "ITEMID") {
            const row = draftRowsRef.current[rowIndex];
            if (row) {
                delete appliedItemIdRef.current[row.__rowId];
                delete lastAppliedTouchRef.current[row.__rowId];
                touchNotFoundRef.current.delete(row.__rowId);
            }
        }
        if (colKey === "PUREID") {
            const row = draftRowsRef.current[rowIndex];
            if (row) {
                delete appliedPureIdRef.current[row.__rowId];
                delete lastAppliedPureRef.current[row.__rowId];
            }
        }

        // ── TOUCH guard ───────────────────────────────────────────────────────────
        if (colKey === "TOUCH") {
            const row = draftRowsRef.current[rowIndex];
            const rowId = row?.__rowId;
            const touchMissing = touchNotFoundRef.current.has(rowId);
            if (touchMissing && !value) {
                toaster.create({
                    title: "Touch Required",
                    description: "No touch found for this selection. Please enter touch manually.",
                    type: "error",
                    duration: 3000,
                });
                return;
            }
            if (value) touchNotFoundRef.current.delete(rowId);
        }

        if ((colKey === "GRSWT" || colKey === "WT") && !isIssue) {
            const row = draftRowsRef.current[rowIndex];
            const rowId = row?.__rowId;
            if (touchNotFoundRef.current.has(rowId) && !row?.TOUCH) {
                toaster.create({
                    title: "Enter Touch First",
                    description: "Please enter touch before proceeding.",
                    type: "warning",
                    duration: 2500,
                });
                return;
            }
        }

        setDraftRows((prev) => {
            const next = prev.map((r, i) => {
                if (i !== rowIndex) return r;
                const updated = { ...r, [colKey]: value };
                if (colKey === "WT") updated.AWT = value;
                recalcRow(updated, !!isIssue);
                return updated;
            });

            const updatedRow = next[rowIndex];
            // ── Only sync when the row is already committed (synced) OR
            //    when a weight/qty field is filled — NOT on ITEMID/PUREID select alone.
            //    This prevents premature onAddRow calls that cause duplicate rows.
            const isAlreadySynced = syncedRowIdsRef.current.has(updatedRow.__rowId);
            const isWeightOrQty = colKey === "GRSWT" || colKey === "WT"
                || colKey === "PCS" || colKey === "NETWT";
            const isMeaningful = !!(updatedRow.ITEMID || updatedRow.PUREID)
                && !!(updatedRow.WT || updatedRow.GRSWT);

            if (isAlreadySynced || (isMeaningful && isWeightOrQty)) {
                setTimeout(() => syncRowToParent(updatedRow), 0);
            }

            return next;
        });

        // ── Stock validation (unchanged) ──────────────────────────────────────────
        if ((colKey === "PCS" || colKey === "NETWT") && transactionType === "SA") {
            const row = draftRowsRef.current[rowIndex];
            if (!row?.ITEMID) return;

            const availablePieces = getAvailablePieces?.(row.ITEMID, {
                excludeRowId: syncedRowIdsRef.current.has(row.__rowId) ? row.__rowId : undefined,
                isEditing: syncedRowIdsRef.current.has(row.__rowId),
                originalPieces: Number(row._originalPieces) || 0,
                transactionTypeCode: transactionType,
            }) ?? null;

            if (availablePieces !== null && colKey === "PCS" && Number(value) > availablePieces) {
                setTimeout(() => {
                    toaster.create({
                        title: "Insufficient Stock",
                        description: `Requested ${value} pcs exceeds available ${availablePieces} pcs`,
                        type: "error",
                    });
                }, 0);
                return;
            }

            const availableWeight = getAvailableWeight?.(row.ITEMID, {
                excludeRowId: syncedRowIdsRef.current.has(row.__rowId) ? row.__rowId : undefined,
                isEditing: syncedRowIdsRef.current.has(row.__rowId),
                originalWeight: Number(row._originalNetwt) || 0,
                transactionTypeCode: transactionType,
            }) ?? null;

            const netwt = parseFloat(row.NETWT) || 0;
            if (availableWeight !== null && netwt > availableWeight) {
                setTimeout(() => {
                    toaster.create({
                        title: "Insufficient Stock",
                        description: `Net weight ${netwt.toFixed(3)}g exceeds available ${availableWeight.toFixed(3)}g`,
                        type: "error",
                    });
                }, 0);
            }
        }
    }, [isIssue, transactionType, getAvailablePieces, getAvailableWeight, syncRowToParent]);

    // ── Active row tracking ───────────────────────────────────────────────────
    const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
    const activeRowPureId = activeRowIndex !== null ? draftRows[activeRowIndex]?.PUREID : undefined;
    const activeRowId = activeRowIndex !== null ? draftRows[activeRowIndex]?.__rowId : undefined;
    const activeRowItemId = activeRowIndex !== null ? draftRows[activeRowIndex]?.ITEMID : undefined;

    const { data: pureStockData } = usePureGoldDataById(activeRowPureId);

    const shouldFetchTouch = !!activeRowItemId && !!acCode;
    const { data: touchData, isLoading: touchDataLoading } = useTouchByFilter(
        { ITEMID: Number(activeRowItemId), ACCODE: Number(acCode) },
        shouldFetchTouch
    );

    // ── Touch data effect ─────────────────────────────────────────────────────
    useEffect(() => {
        if (activeRowIndex === null || !activeRowId || !activeRowItemId) return;
        if (touchDataLoading) return;

        const key = `${activeRowId}::${activeRowItemId}`;
        if (lastAppliedTouchRef.current[activeRowId] === key) return;

        if (!touchData || !touchData.TOUCH) {
            if (!touchNotFoundRef.current.has(activeRowId)) {
                touchNotFoundRef.current.add(activeRowId);
                setTimeout(() => {
                    toaster.create({
                        title: "No Touch Found",
                        description: "No touch configured for this item & customer. Please enter manually.",
                        type: "warning",
                        duration: 3000,
                    });
                }, 0);
            }
            return;
        }

        lastAppliedTouchRef.current[activeRowId] = key;
        appliedItemIdRef.current[activeRowId] = key;
        touchNotFoundRef.current.delete(activeRowId);

        const touch = touchData.TOUCH;
        const calMode = touchData.CALMODE || "NETWT";
        const targetRowId = activeRowId;

        setDraftRows((prev) => {
            const rowIndex = prev.findIndex(r => r.__rowId === targetRowId);
            if (rowIndex === -1) return prev;
            const next = [...prev];
            const row = { ...next[rowIndex], TOUCH: touch, ATOUCH: touch, CAL_MODE: calMode };
            recalcRow(row, false);
            next[rowIndex] = row;

            // Sync touch update to parent
            setTimeout(() => syncRowToParent(row), 0);

            return next;
        });

        setTimeout(() => {
            toaster.create({
                title: "Touch Applied",
                description: `Touch ${touch} applied for selected item.`,
                type: "success",
                duration: 1500,
            });
        }, 10);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [touchData, touchDataLoading]);

    // ── Pure gold effect ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!pureStockData || activeRowIndex === null || !activeRowId || !activeRowPureId) return;

        const key = `${activeRowId}::${activeRowPureId}`;
        if (lastAppliedPureRef.current[activeRowId] === key) return;

        lastAppliedPureRef.current[activeRowId] = key;
        appliedPureIdRef.current[activeRowId] = key;

        const touch = pureStockData.actualTouch;
        const targetRowId = activeRowId;

        setDraftRows((prev) => {
            const rowIndex = prev.findIndex(r => r.__rowId === targetRowId);
            if (rowIndex === -1) return prev;
            const next = [...prev];
            const row = { ...next[rowIndex], TOUCH: touch, ATOUCH: touch };
            recalcRow(row, !!isIssue);
            next[rowIndex] = row;

            // Sync pure gold touch update
            setTimeout(() => syncRowToParent(row), 0);

            return next;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pureStockData]);

    // ── Stone modal ───────────────────────────────────────────────────────────
    const handleOpenStoneModal = useCallback((rowId: string, grsWeight: number) => {
        if (!grsWeight || grsWeight <= 0) {
            toaster.create({ title: "Enter GRSWT first", type: "warning" });
            return;
        }
        const freshRow = useSaleTransactionStore.getState().draftRows.find(
            (r) => r.__rowId === rowId
        );
        setStoneModalRowId(rowId);
        setCurrentGRSWT(grsWeight);
        setStoneModalInitialRows(freshRow?._stones || []);
        setIsStoneModalOpen(true);
    }, []);

    // ── Misc modal ────────────────────────────────────────────────────────────
    const handleOpenMiscModal = useCallback((rowId: string) => {
        setMiscModalRowId(rowId);
        setIsMiscModalOpen(true);
    }, []);

    const miscModalRow = useMemo(
        () => draftRows.find((r) => r.__rowId === miscModalRowId),
        [draftRows, miscModalRowId]
    );
    const otherChargesInitialRows = miscModalRow?._miscCharges || [];

    // ── Tag lookup ────────────────────────────────────────────────────────────
    const handleTagNoKeyDown = async () => {
        if (!tagNo.trim()) return;
        try {
            await onTagNoLookup?.(tagNo);
            setTagNo("");
        } catch (error) {
            toaster.create({ title: "Error", description: "Failed to process tag", type: "error" });
        }
    };

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

    const renderCell = useCallback((params: RenderCellParams) => {
        const { row, col, value, isEditing, isFocused, onChange, onCommit, inputRef } = params;
        const field = formFields.find((f) => f.key === col.key);
        if (!field) return <span style={{ padding: "0 4px", fontSize: 11 }}>{value ?? ""}</span>;

        if (col.computed || col.disabled) {
            let displayValue = value ?? "";
            if (col.decimalScale) displayValue = Number(value || 0).toFixed(col.decimalScale);
            return (
                <span style={{ padding: "0 6px", fontSize: 11, color: "#555", width: "100%", display: "block", textAlign: col.align || "left" }}>
                    {displayValue}
                </span>
            );
        }

        if (col.key === "STNWT") {
            const stonesCount = (row._stones || []).length;
            return (
                <div
                    style={{ display: "flex", alignItems: "center", width: "100%", padding: "0 2px" }}
                    onFocus={() => handleOpenStoneModal(row.__rowId, parseFloat(row.GRSWT) || 0)}
                    onClick={() => handleOpenStoneModal(row.__rowId, parseFloat(row.GRSWT) || 0)}
                >
                    <CapitalizedInput
                        field={col.key} value={value || ""} onChange={(_, v) => onChange(v)}
                        type="number" isCapitalized={false} size="xs" rounded="sm"
                        decimalScale={field.decimalScale} inputRef={inputRef} onEnter={onCommit} noBorder
                    />
                    {stonesCount > 0 && <span style={{ fontSize: 10, color: "#805AD5", flexShrink: 0, paddingRight: 2 }}>💎</span>}
                </div>
            );
        }

        if (col.key === "HMC") {
            const chargesCount = (row._miscCharges || []).length;
            return (
                <div
                    style={{ display: "flex", alignItems: "center", width: "100%", padding: "0 2px" }}
                    onFocus={() => handleOpenMiscModal(row.__rowId)}
                    onClick={() => handleOpenMiscModal(row.__rowId)}
                >
                    <CapitalizedInput
                        field={col.key} value={value || ""} onChange={(_, v) => onChange(v)}
                        type="number" isCapitalized={false} size="xs" rounded="sm"
                        decimalScale={2} inputRef={inputRef} onEnter={onCommit} noBorder
                    />
                    {chargesCount > 0 && <span style={{ fontSize: 10, color: "#C05621", flexShrink: 0, paddingRight: 2 }}>📋</span>}
                </div>
            );
        }

        if (col.key === "STNAMT") {
            const stonesTotal = (row._stones || []).reduce((s: number, st: any) => s + (Number(st.stoneAmount) || 0), 0);
            return (
                <span style={{ padding: "0 6px", fontSize: 11, color: "#333", width: "100%", display: "block", textAlign: "right" }}>
                    {stonesTotal > 0 ? stonesTotal.toFixed(2) : value || ""}
                </span>
            );
        }

        // if (col.key === "DESCRIPTION") {
        //     return (
        //         <TextareaField value={value || ""} field="DESCRIPTION" onChange={(_, v) => onChange(v)}
        //             onEnter={onCommit} mode="dialog" rows={3} dialogInputRef={inputRef} disable={false} />
        //     );
        // }

        if (col.key === "TAGNO") {
            return (
                <CapitalizedInput field={col.key} value={value || ""} onChange={(_, v) => onChange(v)}
                    type="text" isCapitalized size="xs" rounded="sm" inputRef={inputRef} onEnter={onCommit} noBorder disabled />
            );
        }

        if (col.key === "ITEMID" || col.key === "PUREID") {
            const items = field.collection?.items || [];
            if (!isEditing && !isFocused) {
                const item = items.find((i) => i.value === value?.toString());
                return (
                    <span style={{ padding: "0 6px", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                        {item?.label || value || ""}
                    </span>
                );
            }
            return (
                <SelectCombobox value={value || ""} onChange={(v) => { onChange(v); if (v) onCommit(); }}
                    items={items} placeholder={field.placeholder || `Select ${field.label}`}
                    ref={inputRef as React.RefObject<HTMLInputElement>} rounded="sm" disable={false} onEnter={onCommit} />
            );
        }

        if (isIssue && col.key === "TOUCH") {
            return (
                <CapitalizedInput field={col.key} value={value || ""} onChange={(_, v) => onChange(v)}
                    type="number" isCapitalized size="xs" rounded="sm"
                    decimalScale={field.decimalScale} inputRef={inputRef} onEnter={onCommit} noBorder />
            );
        }

        return (
            <CapitalizedInput field={col.key} value={value || ""} onChange={(_, v) => onChange(v)}
                type={field.type === "number" ? "number" : "text"} isCapitalized={field.type !== "number"}
                size="xs" rounded="sm" decimalScale={field.decimalScale} inputRef={inputRef} onEnter={onCommit} noBorder />
        );
    }, [formFields, isIssue, handleOpenStoneModal, handleOpenMiscModal]);

    const TYPE_COLORS: Record<string, string> = { SA: "#b7fff1", SR: "#ffc4c4", IS: "#ffd9a4", RE: "#ffcafb" };
    const accentColor = { SA: "#2F855A", SR: "#C53030", IS: "#DD6B20", RE: "#c729ba" }[transactionType ?? ""] ?? "#185FA5";
    const showTag = getIsTagEnabled(transactionType);
    const showBill = getIsBillModalEnabled(transactionType);
    const { showBillModal, handleBillShow } = onSaleReturnModal;

    useGlobalKey("Escape", () => setIsMiscModalOpen(false), "close-modal");

    const committedRows = draftRows.filter((r) => !!(r.ITEMID || r.PUREID || r.WT || r.GRSWT || r.PCS));

    return (
        <Box display="flex" flexDirection="column" gap={0}>
            <Flex justifyContent="space-between" alignItems="center" px={2} py={1} bg="#FFF" color="#222"
                rounded="md" borderWidth="1px" borderColor={theme?.colors?.borderColor || "#CBD5E0"}>
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
                                    <CapitalizedInput field="tagNo" value={tagNo}
                                        onChange={(_, value) => setTagNo(value)} size="xs" onEnter={handleTagNoKeyDown} />
                                </Box>
                            )}
                        </>
                    )}
                    {showBill && (
                        <Button size="2xs" bg="blue.subtle" color={theme?.colors?.primaryText || "#1a202c"} onClick={() => handleBillShow()}>
                            Bills 📄
                        </Button>
                    )}
                    <Badge colorPalette={committedRows.length > 0 ? "green" : "gray"} variant="subtle" fontSize="2xs" px={2}>
                        {committedRows.length} item{committedRows.length !== 1 ? "s" : ""}
                    </Badge>
                  
                </HStack>
                {!isEditing && (
                    <Button size="2xs" colorPalette="red" variant="outline" fontSize="2xs"
                        onClick={() => {
                            onClear?.();
                            setDraftRows([makeEmptyRow(formFields, !!isIssue)]);
                            syncedRowIdsRef.current = new Set();
                            committedRowIdsRef.current = new Set();
                            appliedPureIdRef.current = {};
                            appliedItemIdRef.current = {};
                            touchNotFoundRef.current = new Set();
                            lastAppliedTouchRef.current = {};
                            lastAppliedPureRef.current = {};
                        }}>
                        <Icon as={LuX} boxSize={2} /> Clear All
                    </Button>
                )}
            </Flex>

            <Box bg={TYPE_COLORS[transactionType ?? ""] || "#FFF"} borderWidth="1px"
                borderColor={theme?.colors?.borderColor || "#CBD5E0"} borderRadius="md" overflow="hidden">
                <ExcelGrid
                    columns={gridColumns}
                    rows={draftRows} 
                    renderCell={renderCell}
                    onCellChange={handleCellChange} 
                    onRowAdd={handleAddRow} 
                    onRowDelete={handleDeleteRow}
                    onActiveChange={(coord) => setActiveRowIndex(coord?.rowIndex ?? null)}
                    errors={{}} 
                    touched={{}} 
                    showTotals={committedRows.length > 0}
                    showAddRow 
                    showDeleteRow 
                    maxVisibleRows={3} 
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

            {/* ── Stone modal ───────────────────────────────────────────────── */}
            {isStoneModalOpen && stoneModalRowId && (
                <Box position="fixed" top={0} left={0} right={0} bottom={0} bg="rgba(0,0,0,0.5)"
                    zIndex={100} display="flex" alignItems="center" justifyContent="center"
                    onClick={() => setIsStoneModalOpen(false)}>
                    <Box bg={theme?.colors?.formColor || "white"} borderRadius="lg"
                        maxW="1200px" width="100%" maxH="90vh" overflow="auto"
                        onClick={(e) => e.stopPropagation()}>
                        <StoneEnterMaster
                            grsWeight={currentGRSWT}
                            onClose={() => setIsStoneModalOpen(false)}
                            draftRowId={stoneModalRowId}
                            initialRows={stoneModalInitialRows}
                            onSave={(stoneRows) => {
                                const updatedStones = stoneRows.map((s) => ({ ...s, draftRowId: stoneModalRowId }));
                                const stoneWtTotal = updatedStones.reduce((sum, r) => {
                                    const wt = Number(r.stoneWeight || 0);
                                    return sum + (r.stoneUnit === "c" ? wt / 5 : wt);
                                }, 0);
                                const stnAmtTotal = updatedStones.reduce((sum, r) => sum + r.stoneAmount, 0);
                                const targetId = stoneModalRowId;

                                setDraftRows((prev) => prev.map((r) => {
                                    if (r.__rowId !== targetId) return r;
                                    const updated = recalcRow({
                                        ...r,
                                        _stones: updatedStones,
                                        STNWT: stoneWtTotal.toFixed(3),
                                        STNAMT: stnAmtTotal.toFixed(2),
                                    }, !!isIssue);
                                    // Sync stone update
                                    setTimeout(() => syncRowToParent(updated), 0);
                                    return updated;
                                }));

                                setIsStoneModalOpen(false);
                                toaster.create({
                                    title: "Stones Updated",
                                    description: `Total stone weight: ${stoneWtTotal.toFixed(3)}g`,
                                    type: "success", duration: 2000,
                                });
                            }}
                            stoneItems={stoneItemsCollection}
                        />
                    </Box>
                </Box>
            )}

            {/* ── Misc modal ────────────────────────────────────────────────── */}
            {isMiscModalOpen && miscModalRowId && (
                <Box position="fixed" top={0} left={0} right={0} bottom={0} bg="rgba(0,0,0,0.5)"
                    zIndex={100} display="flex" alignItems="center" justifyContent="center"
                    onClick={() => setIsMiscModalOpen(false)}>
                    <Box bg={theme?.colors?.formColor || "white"} borderRadius="lg"
                        maxW="600px" width="100%" maxH="90vh" overflow="auto"
                        onClick={(e) => e.stopPropagation()}>
                        <OtherChargesWindow
                            draftRowId={miscModalRowId}
                            onClose={() => setIsMiscModalOpen(false)}
                            initialRows={otherChargesInitialRows}
                            onSave={(chargeRows) => {
                                const updatedCharges = chargeRows.map((c) => ({ ...c, draftRowId: miscModalRowId }));
                                const total = updatedCharges.reduce((sum, c) => sum + (Number(c.finalAmount) || 0), 0);
                                const targetId = miscModalRowId;

                                setDraftRows((prev) => prev.map((r) => {
                                    if (r.__rowId !== targetId) return r;
                                    const updated = { ...r, _miscCharges: updatedCharges, HMC: total.toFixed(2) };
                                    // Sync misc charges update
                                    setTimeout(() => syncRowToParent(updated), 0);
                                    return updated;
                                }));

                                toaster.create({
                                    title: "Charges Updated",
                                    description: `Total charges: Rs.${total.toFixed(2)}`,
                                    type: "success", duration: 2000,
                                });
                                setIsMiscModalOpen(false);
                            }}
                            chargeItems={otherChargesList}
                            otherChargesData={otherChargesData}
                            pcs={Number(miscModalRow?.PCS)}
                        />
                    </Box>
                </Box>
            )}

            <SalesBillViewModal
                isOpen={showBillModal} onClose={handleBillShow}
                billParams={onSaleReturnModal.billParams}
                onBillParamChange={onSaleReturnModal.onBillParamChange}
                billDetails={onSaleReturnModal.billDetails}
                loading={onSaleReturnModal.loading}
            />
        </Box>
    );
}