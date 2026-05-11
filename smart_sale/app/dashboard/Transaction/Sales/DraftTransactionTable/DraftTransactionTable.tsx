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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

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

    // ── Draft state ────────────────────────────────────────────────────────────
    const [draftRows, setDraftRows] = useState<Record<string, any>[]>([]);
    const draftRowsRef = useRef(draftRows);
    useEffect(() => { draftRowsRef.current = draftRows; }, [draftRows]);

    // ── Stable refs ────────────────────────────────────────────────────────────
    const committedRowIdsRef = useRef<Set<string>>(new Set());
    // pendingParentCallRef: stores side-effects to flush AFTER render.
    // NEVER call onAddRow / onUpdateRow / onRemoveRow inside a setState updater.
    const pendingParentCallRef = useRef<(() => void) | null>(null);
    const appliedPureIdRef = useRef<Record<string, string>>({});
    const appliedItemIdRef = useRef<Record<string, string>>({});
    const touchNotFoundRef = useRef<Set<string>>(new Set());
    // Hash-based change detection — drives all parent sync
    const lastSyncedRowsRef = useRef<Record<string, string>>({});
    // Tracks uncommitted draft rows to be replaced by incoming TagNo rows
    const pendingTagReplaceRef = useRef<Set<string>>(new Set());

    // ── Modal state ────────────────────────────────────────────────────────────
    const [stoneModalRowId, setStoneModalRowId] = useState<string | null>(null);
    const [miscModalRowId, setMiscModalRowId] = useState<string | null>(null);
    const [currentGRSWT, setCurrentGRSWT] = useState<number>(0);
    const [isStoneModalOpen, setIsStoneModalOpen] = useState(false);
    const [stoneModalInitialRows, setStoneModalInitialRows] = useState<any[]>([]);
    const [isMiscModalOpen, setIsMiscModalOpen] = useState(false);

    // ── Stone items ────────────────────────────────────────────────────────────
    const { data: stoneItemsData } = useStoneItems({ STUDDED: "Y" });
    const [stoneItemsCollection, setStoneItemCollection] =
        useState<{ label: string; value: string }[]>([]);
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
            // if (!isIssue && col.key === "TOUCH" && transactionType === "SA")
            //     return { ...base, disabled: true };

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

    // ── Parent rows → draftRows sync ──────────────────────────────────────────
    const parentRowsRef = useRef(rows);
    const isFirstSyncRef = useRef(true);

    useEffect(() => {
        parentRowsRef.current = rows;

        // ── Initial load ──────────────────────────────────────────────────────
        if (isFirstSyncRef.current) {
            isFirstSyncRef.current = false;
            rows.forEach((r) => committedRowIdsRef.current.add(r.__rowId));
            const converted = rows.length > 0
                ? rows.map((r) => recalcRow({ ...r }, !!isIssue))
                : [makeEmptyRow(formFields, !!isIssue)];
            setDraftRows(converted);
            return;
        }

        // ── Transaction switch ────────────────────────────────────────────────
        const currentDraftIds = new Set(draftRowsRef.current.map((r) => r.__rowId));
        const hasOverlap = rows.some((r) => currentDraftIds.has(r.__rowId));
        const isSwitch = !hasOverlap && rows.length > 0;

        if (isSwitch) {
            committedRowIdsRef.current = new Set();
            appliedPureIdRef.current = {};
            appliedItemIdRef.current = {};
            touchNotFoundRef.current = new Set();
            lastSyncedRowsRef.current = {};
            pendingTagReplaceRef.current = new Set();
            rows.forEach((r) => committedRowIdsRef.current.add(r.__rowId));
            const converted = rows.map((r) => recalcRow({ ...r }, !!isIssue));
            setDraftRows(converted.length > 0 ? converted : [makeEmptyRow(formFields, !!isIssue)]);
            return;
        }

        // ── Incremental merge ─────────────────────────────────────────────────
        setDraftRows((prev) => {
            const parentMap = new Map(rows.map((r) => [r.__rowId, r]));
            const localMap = new Map(prev.map((r) => [r.__rowId, r]));
            const next: Record<string, any>[] = [];

            prev.forEach((localRow) => {
                if (parentMap.has(localRow.__rowId)) {
                    // Local edits win; pull parent-only fields underneath
                    next.push(recalcRow(
                        { ...parentMap.get(localRow.__rowId)!, ...localRow },
                        !!isIssue
                    ));
                } else {
                    // Drop rows flagged for tag-replacement
                    if (pendingTagReplaceRef.current.has(localRow.__rowId)) {
                        pendingTagReplaceRef.current.delete(localRow.__rowId);
                        delete appliedItemIdRef.current[localRow.__rowId];
                        delete appliedPureIdRef.current[localRow.__rowId];
                        touchNotFoundRef.current.delete(localRow.__rowId);
                        delete lastSyncedRowsRef.current[localRow.__rowId];
                        return; // drop — TagNo row replaces it
                    }
                    // Keep uncommitted local rows; drop externally-deleted committed rows
                    if (!committedRowIdsRef.current.has(localRow.__rowId)) {
                        next.push(localRow);
                    }
                }
            });

            // Pull in rows added externally (TagNo lookup, initialFormData, etc.)
            rows.forEach((r) => {
                if (!localMap.has(r.__rowId)) {
                    next.push(recalcRow({ ...r }, !!isIssue));
                    committedRowIdsRef.current.add(r.__rowId);
                }
            });

            return next.length === 0 ? [makeEmptyRow(formFields, !!isIssue)] : next;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows]);

    // Keep committedRowIds consistent on every parent rows update
    useEffect(() => {
        rows.forEach((r) => committedRowIdsRef.current.add(r.__rowId));
    }, [rows]);

    // ── Reset on transaction type change ──────────────────────────────────────
    const prevTransactionTypeRef = useRef(transactionType);
    useEffect(() => {
        if (prevTransactionTypeRef.current !== transactionType) {
            prevTransactionTypeRef.current = transactionType;
            isFirstSyncRef.current = true;
            committedRowIdsRef.current = new Set();
            appliedPureIdRef.current = {};
            appliedItemIdRef.current = {};
            touchNotFoundRef.current = new Set();
            lastSyncedRowsRef.current = {};
            pendingTagReplaceRef.current = new Set();
        }
    }, [transactionType]);

    // ── initialFormData handler ────────────────────────────────────────────────
    useEffect(() => {
        if (!initialFormData?.__rowId) return;
        const rowId = initialFormData.__rowId;
        setDraftRows((prev) => {
            const idx = prev.findIndex((r) => r.__rowId === rowId);
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = recalcRow({ ...next[idx], ...initialFormData }, !!isIssue);
                return next;
            }
            const newRow = recalcRow({ ...initialFormData }, !!isIssue);
            committedRowIdsRef.current.add(newRow.__rowId);
            return [...prev, newRow];
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialFormData]);

    // ── Hash-based draftRows → parent sync ────────────────────────────────────
    // Runs after every render. Detects changed rows via JSON hash and pushes
    // only those to the parent store. No sync logic needed elsewhere.
    useEffect(() => {
        const current = draftRowsRef.current;

        current.forEach((row, rowIndex) => {
            const isMeaningful = !!(row.ITEMID || row.PUREID || row.WT || row.GRSWT);
            if (!isMeaningful) return;

            const isCommitted = committedRowIdsRef.current.has(row.__rowId);

            // For new rows: only commit once GRSWT or WT is present.
            // This prevents PCS-alone from triggering onAddRow (duplicate-row bug).
            if (!isCommitted) {
                const hasCommitWeight = isIssue
                    ? !!(row.PUREID && row.WT)          // both required for issue
                    : !!(row.ITEMID && row.PCS);         // both required for receipt
                if (!hasCommitWeight) return;
            }

            // Serialize for change detection (exclude internal meta fields)
            const { __rowId, _stones, _miscCharges, ...syncableFields } = row;
            const rowHash = JSON.stringify(syncableFields);
            const lastHash = lastSyncedRowsRef.current[row.__rowId];
            if (rowHash === lastHash) return; // nothing changed

            lastSyncedRowsRef.current[row.__rowId] = rowHash;

            const snapshot = { ...row };

            if (isCommitted) {
                // Already in store — push field updates after render
                pendingParentCallRef.current = () => {
                    Object.keys(snapshot).forEach((field) => {
                        if (field === "__rowId") return;
                        onUpdateRow(snapshot.__rowId, field, snapshot[field]);
                    });
                };
            } else {
                // First commit
                committedRowIdsRef.current.add(row.__rowId);
                pendingParentCallRef.current = () => onAddRow(snapshot);
            }
        });

        // Clean up hashes for deleted rows
        const currentIds = new Set(current.map((r) => r.__rowId));
        Object.keys(lastSyncedRowsRef.current).forEach((id) => {
            if (!currentIds.has(id)) delete lastSyncedRowsRef.current[id];
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draftRows]);

    // ── Flush pending parent calls after every render ─────────────────────────
    // This ensures Zustand / parent store updates NEVER fire during React render,
    // eliminating "setState while rendering a different component" errors entirely.
    useEffect(() => {
        if (pendingParentCallRef.current) {
            const call = pendingParentCallRef.current;
            pendingParentCallRef.current = null;
            call();
        }
    });

    // ── Add empty row ──────────────────────────────────────────────────────────
    const handleAddRow = useCallback(() => {
        setDraftRows((prev) => [...prev, makeEmptyRow(formFields, !!isIssue)]);
    }, [formFields, isIssue]);

    // ── Delete row ─────────────────────────────────────────────────────────────
    const handleDeleteRow = useCallback((rowIndex: number) => {
        const row = draftRowsRef.current[rowIndex];
        if (!row) return;

        const isBlank = !row.ITEMID && !row.PUREID && !row.WT && !row.GRSWT;
        if (!isBlank && !window.confirm("Delete this row?")) return;

        const wasCommitted = committedRowIdsRef.current.has(row.__rowId);
        const rowIdToRemove = row.__rowId;

        // Clean up tracking refs (safe — not during render)
        committedRowIdsRef.current.delete(rowIdToRemove);
        delete appliedItemIdRef.current[rowIdToRemove];
        delete appliedPureIdRef.current[rowIdToRemove];
        touchNotFoundRef.current.delete(rowIdToRemove);
        delete lastSyncedRowsRef.current[rowIdToRemove];
        pendingTagReplaceRef.current.delete(rowIdToRemove);

        setDraftRows((prev) => {
            const next = prev.filter((_, i) => i !== rowIndex);
            return next.length === 0 ? [makeEmptyRow(formFields, !!isIssue)] : next;
        });

        // Defer parent notification — never inside setState
        if (wasCommitted) {
            pendingParentCallRef.current = () => onRemoveRow(rowIdToRemove);
        }
    }, [formFields, isIssue, onRemoveRow]);

    // ── Cell change ────────────────────────────────────────────────────────────
    // Clean and simple: only updates local draft state.
    // The hash-based useEffect above handles all parent sync automatically.
    const handleCellChange = useCallback((rowIndex: number, colKey: string, value: any) => {

        // ── Reset touch guards when item selection changes ─────────────────────
        if (colKey === "ITEMID") {
            const row = draftRowsRef.current[rowIndex];
            if (row) {
                delete appliedItemIdRef.current[row.__rowId];
                touchNotFoundRef.current.delete(row.__rowId);
            }
        }
        if (colKey === "PUREID") {
            const row = draftRowsRef.current[rowIndex];
            if (row) {
                delete appliedPureIdRef.current[row.__rowId];
            }
        }

        // ── TOUCH guard: block empty-touch when no touch was found ─────────────
        if (colKey === "TOUCH") {
            const row = draftRowsRef.current[rowIndex];
            const rowId = row?.__rowId;
            if (touchNotFoundRef.current.has(rowId) && !value) {
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

        // ── Block GRSWT/WT if touch is still missing ───────────────────────────
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

        // ── Stock validation (SA transaction) ──────────────────────────────────
        if ((colKey === "PCS" || colKey === "NETWT") && transactionType === "SA") {
            const row = draftRowsRef.current[rowIndex];
            if (row?.ITEMID) {
                const isCommitted = committedRowIdsRef.current.has(row.__rowId);
                const opts = {
                    excludeRowId: isCommitted ? row.__rowId : undefined,
                    isEditing: isCommitted,
                    originalPieces: Number(row._originalPieces) || 0,
                    transactionTypeCode: transactionType,
                };

                if (colKey === "PCS") {
                    const available = getAvailablePieces?.(row.ITEMID, opts) ?? null;
                    if (available !== null && Number(value) > available) {
                        setTimeout(() => toaster.create({
                            title: "Insufficient Stock",
                            description: `Requested ${value} pcs exceeds available ${available} pcs`,
                            type: "error",
                        }), 0);
                        return;
                    }
                }

                if (colKey === "NETWT") {
                    const wOpts = { ...opts, originalWeight: Number(row._originalNetwt) || 0 };
                    const avWt = getAvailableWeight?.(row.ITEMID, wOpts) ?? null;
                    const netwt = parseFloat(row.NETWT) || 0;
                    if (avWt !== null && netwt > avWt) {
                        setTimeout(() => toaster.create({
                            title: "Insufficient Stock",
                            description: `Net weight ${netwt.toFixed(3)}g exceeds available ${avWt.toFixed(3)}g`,
                            type: "error",
                        }), 0);
                    }
                }
            }
        }

        // ── Update local draft state ───────────────────────────────────────────
        setDraftRows((prev) => {
            const next = prev.map((r, i) => {
                if (i !== rowIndex) return r;
                const updated = { ...r, [colKey]: value };
                if (colKey === "WT") updated.AWT = value;
                recalcRow(updated, !!isIssue);
                return updated;
            });
            return next;
        });
        // The hash-based useEffect detects the change and syncs to parent.

    }, [isIssue, transactionType, getAvailablePieces, getAvailableWeight]);

    // ── Active row tracking ────────────────────────────────────────────────────
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

    // ── Touch data effect ──────────────────────────────────────────────────────
    useEffect(() => {
        if (activeRowIndex === null || !activeRowId || !activeRowItemId) return;
        if (touchDataLoading) return;

        const key = `${activeRowId}::${activeRowItemId}`;
        if (appliedItemIdRef.current[activeRowId] === key) return; // already applied

        // ── Touch NOT found → clear ITEMID, warn ──────────────────────────────
        // if (!touchData || !touchData.TOUCH) {
        //     if (!touchNotFoundRef.current.has(activeRowId)) {
        //         touchNotFoundRef.current.add(activeRowId);

        //         setDraftRows((prev) => {
        //             const idx = prev.findIndex((r) => r.__rowId === activeRowId);
        //             if (idx === -1) return prev;
        //             const next = [...prev];
        //             const row = { ...next[idx] };
        //             row.ITEMID = "";
        //             row.TOUCH = "";
        //             row.ATOUCH = "";
        //             row.CAL_MODE = "";
        //             recalcRow(row, !!isIssue);
        //             next[idx] = row;
        //             return next;
        //         });

        //         setTimeout(() => {
        //             toaster.create({
        //                 title: "No Touch Found",
        //                 description: "No touch configured for this item & customer. Item cleared.",
        //                 type: "warning",
        //                 duration: 3000,
        //             });
        //         }, 0);
        //     }
        //     return;
        // }

        // ── Touch found → apply ────────────────────────────────────────────────
        appliedItemIdRef.current[activeRowId] = key;
        touchNotFoundRef.current.delete(activeRowId);

        const touch = touchData?.TOUCH;
        const calMode = touchData?.CALMODE || "NETWT";
        const targetId = activeRowId;

        setDraftRows((prev) => {
            const idx = prev.findIndex((r) => r.__rowId === targetId);
            if (idx === -1) return prev;
            const next = [...prev];
            const row = { ...next[idx], TOUCH: touch, ATOUCH: touch, CAL_MODE: calMode };
            recalcRow(row, false);
            next[idx] = row;
            return next;
        });

        // Only push to parent if row is already committed.
        // If not yet committed, the hash-based useEffect will include TOUCH
        // naturally when the user enters GRSWT/WT and triggers the first commit.
        const wasCommitted = committedRowIdsRef.current.has(activeRowId);
        if (wasCommitted) {
            pendingParentCallRef.current = () => {
                onUpdateRow(targetId, "TOUCH", touch);
                onUpdateRow(targetId, "ATOUCH", touch);
                onUpdateRow(targetId, "CAL_MODE", calMode);
            };
        }

        setTimeout(() => {
            toaster.create({
                title: "Touch Applied",
                description: `Touch ${touch} applied for selected item.`,
                type: "success",
                duration: 1500,
            });
        }, 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [touchData, touchDataLoading]);

    // ── Pure gold effect ───────────────────────────────────────────────────────
    useEffect(() => {
        if (!pureStockData || activeRowIndex === null || !activeRowId || !activeRowPureId) return;

        const key = `${activeRowId}::${activeRowPureId}`;
        if (appliedPureIdRef.current[activeRowId] === key) return;

        const touch = pureStockData.actualTouch;
        const targetId = activeRowId;

        // ── No touch on pure item → clear PUREID ──────────────────────────────
        if (!touch) {
            if (!touchNotFoundRef.current.has(activeRowId)) {
                touchNotFoundRef.current.add(activeRowId);

                setDraftRows((prev) => {
                    const idx = prev.findIndex((r) => r.__rowId === targetId);
                    if (idx === -1) return prev;
                    const next = [...prev];
                    const row = { ...next[idx] };
                    row.PUREID = "";
                    row.TOUCH = "";
                    row.ATOUCH = "";
                    row.WT = "";
                    row.AWT = "";
                    recalcRow(row, !!isIssue);
                    next[idx] = row;
                    return next;
                });

                setTimeout(() => {
                    toaster.create({
                        title: "No Touch Found",
                        description: "No touch configured for this pure gold item. Selection cleared.",
                        type: "warning",
                        duration: 3000,
                    });
                }, 0);
            }
            return;
        }

        // ── Touch found → apply ────────────────────────────────────────────────
        appliedPureIdRef.current[activeRowId] = key;
        touchNotFoundRef.current.delete(activeRowId);

        setDraftRows((prev) => {
            const idx = prev.findIndex((r) => r.__rowId === targetId);
            if (idx === -1) return prev;
            const next = [...prev];
            const row = { ...next[idx], TOUCH: touch, ATOUCH: touch };
            recalcRow(row, !!isIssue);
            next[idx] = row;
            return next;
        });

        const wasCommitted = committedRowIdsRef.current.has(activeRowId);
        if (wasCommitted) {
            pendingParentCallRef.current = () => {
                onUpdateRow(targetId, "TOUCH", touch);
                onUpdateRow(targetId, "ATOUCH", touch);
            };
        }

        setTimeout(() => {
            toaster.create({
                title: "Touch Applied",
                description: `Touch ${touch} applied from pure gold data.`,
                type: "success",
                duration: 1500,
            });
        }, 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pureStockData]);

    // ── Stone modal ────────────────────────────────────────────────────────────
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
        if (!tagNo.trim()) return;
        try {
            // Register the active uncommitted row for replacement.
            // The incremental merge will drop it when the TagNo row arrives from parent.
            const activeRow = activeRowIndex !== null
                ? draftRowsRef.current[activeRowIndex]
                : null;
            if (activeRow && !committedRowIdsRef.current.has(activeRow.__rowId)) {
                pendingTagReplaceRef.current.add(activeRow.__rowId);
            }
            await onTagNoLookup?.(tagNo);
            setTagNo("");
        } catch (error) {
            pendingTagReplaceRef.current.clear();
            toaster.create({ title: "Error", description: "Failed to process tag", type: "error" });
        }
    };

    // ── Totals row ─────────────────────────────────────────────────────────────
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
            const stonesTotal = (row._stones || []).reduce(
                (s: number, st: any) => s + (Number(st.stoneAmount) || 0), 0
            );
            return (
                <span style={{ padding: "0 6px", fontSize: 11, color: "#333", width: "100%", display: "block", textAlign: "right" }}>
                    {stonesTotal > 0 ? stonesTotal.toFixed(2) : value || ""}
                </span>
            );
        }

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

    // ── Misc ───────────────────────────────────────────────────────────────────
    const TYPE_COLORS: Record<string, string> = { SA: "#b7fff1", SR: "#ffc4c4", IS: "#ffd9a4", RE: "#ffcafb" };
    const accentColor = { SA: "#2F855A", SR: "#C53030", IS: "#DD6B20", RE: "#c729ba" }[transactionType ?? ""] ?? "#185FA5";
    const showTag = getIsTagEnabled(transactionType);
    const showBill = getIsBillModalEnabled(transactionType);
    const { showBillModal, handleBillShow } = onSaleReturnModal;

    useGlobalKey("Escape", () => setIsMiscModalOpen(false), "close-modal");

    const committedRows = draftRows.filter((r) => !!(r.ITEMID || r.PUREID || r.WT || r.GRSWT || r.PCS));

    // ── Clear all helper (also resets all refs) ────────────────────────────────
    const handleClearAll = useCallback(() => {
        onClear?.();
        committedRowIdsRef.current = new Set();
        appliedPureIdRef.current = {};
        appliedItemIdRef.current = {};
        touchNotFoundRef.current = new Set();
        lastSyncedRowsRef.current = {};
        pendingTagReplaceRef.current = new Set();
        setDraftRows([makeEmptyRow(formFields, !!isIssue)]);
    }, [onClear, formFields, isIssue]);

    // ─── Render ────────────────────────────────────────────────────────────────
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
                    <Button size="2xs" colorPalette="red" variant="outline" fontSize="2xs" onClick={handleClearAll}>
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
                                    return recalcRow({
                                        ...r,
                                        _stones: updatedStones,
                                        STNWT: stoneWtTotal.toFixed(3),
                                        STNAMT: stnAmtTotal.toFixed(2),
                                    }, !!isIssue);
                                    // hash-based effect will detect the change and sync to parent
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
                                    return { ...r, _miscCharges: updatedCharges, HMC: total.toFixed(2) };
                                    // hash-based effect will detect the change and sync to parent
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