"use client";

import React, {
    useMemo, useCallback, useState, useEffect, useRef,
} from "react";
import {
    Box, Text, Button, Flex, Badge, HStack, Icon,
} from "@chakra-ui/react";
import { LuX } from "react-icons/lu";

import { issueColumns, purchaseColumns } from "../transactionForm/TransactionForm";
import { useStoneItems } from "@/hooks/apiHooks/item/useItems";
import StoneEnterMaster from "../StoneMaster/StoneEntryMaster";
import OtherChargesWindow from "../OtherCharges/OtherChargesWindow";
import { SelectCombobox } from "@/components/ui/selectComboBox";
import { useGlobalKey } from "@/components/key/useGlobalKey";
import { toaster } from "@/components/ui/toaster";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { getIsTagEnabled } from "@/config/transaction/PurchaseConfig";
import { usePureGoldDataById } from "@/hooks/apiHooks/pureGoldMast/usePureGoldMastData";
import { TextareaField } from "@/components/ui/CapitalizesTextArea";
import { ExcelGrid, ColumnDef, RenderCellParams } from "@/component/table/ExcelGrid";

import { useTouchByFilter } from "@/hooks/apiHooks/touch/useTouchMastData";
import { usePurchaseTransactionStore } from "@/store/purchase/usePurchaseTransactionStore";

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

type TouchFilter ={
    ACCODE :String;
    ITEMID:string;
}

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

/** Generate a unique draft row ID */
const newRowId = () => `row-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

/** Recalculate derived fields for a row object in-place */
function recalcRow(
    row: Record<string, any>,
    isIssue: boolean,
  
) {
    const g = parseFloat(row.GRSWT) || 0;
    const s = parseFloat(row.STNWT) || 0;
    const touch = parseFloat(row.TOUCH) || 0;
    const wt = parseFloat(row.WT) || 0;
    const awt = parseFloat(row.AWT) || 0;
    const atouch = parseFloat(row.ATOUCH) || 0;

    const calMode = row.CAL_MODE || "NETWT";

    row.NETWT = (g - s).toFixed(3);
    console.log(calMode, "calMode");

    const baseWt =
        calMode === "NETWT"
            ? (g - s)
            : (g);

    row.PUREWT = isIssue
        ? ((wt * touch) / 100).toFixed(3)
        : ((baseWt * touch) / 100).toFixed(3);

    row.APUREWT = ((awt * atouch) / 100).toFixed(3);

    return row;
}
/** Create a blank row with default values */
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



    const [draftRows, setDraftRows] = useState<Record<string, any>[]>([]);
    const draftRowsRef = useRef(draftRows);
    useEffect(() => { draftRowsRef.current = draftRows; }, [draftRows]);


    const [calculationMode ,setCalculationMode] = useState<string>('');

    // ── Stable refs declared early so all callbacks below can reference them ──
    const committedRowIdsRef = useRef<Set<string>>(new Set());

    // pendingParentCallRef: stores side-effects to flush AFTER render
    // This is the key pattern to avoid calling Zustand setState during React render
    const pendingParentCallRef = useRef<(() => void) | null>(null);
    const appliedPureIdRef = useRef<Record<string, string>>({});
    const appliedItemIdRef = useRef<Record<string, string>>({});

    console.log(pendingParentCallRef.current ,  'draftRows length')

    // ── Local State ────────────────────────────────────────────────────────────

    const touchNotFoundRef = useRef<Set<string>>(new Set());

    // ── Stone / misc modal state ───────────────────────────────────────────────
    const [stoneModalRowId, setStoneModalRowId] = useState<string | null>(null);
    const [miscModalRowId, setMiscModalRowId] = useState<string | null>(null);
    const [currentGRSWT, setCurrentGRSWT] = useState<number>(0);
    const [isStoneModalOpen, setIsStoneModalOpen] = useState(false);
    const [stoneModalInitialRows, setStoneModalInitialRows] = useState<any[]>([]);
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
        return isTag && transactionType === "PR"
            ? ["TAGNO", "ITEMID", "PCS", "GRSWT", "STNWT", "NETWT", "WASTYPE", "WASPER",
                "WASTAGE", "TOUCH", "PUREWT", "HMC", "MC", "STNAMT", "DESCRIPTION"]
            : ["ITEMID", "PCS", "GRSWT", "STNWT", "NETWT", "WASTYPE", "WASPER",
                "WASTAGE", "TOUCH", "PUREWT", "HMC", "MC", "STNAMT", "DESCRIPTION"];
    }, [isIssue, isTag, transactionType]);

    console.log(transactionType,'transactionType');

    const baseColumns = isIssue ? issueColumns : purchaseColumns(isTag);
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
                : ["ITEMID", "PCS", "GRSWT", "TOUCH" ,"HMC"].includes(col.key);
            

            const base: FormField = {
                key: col.key,
                label: col.label || col.key || "",
                placeholder: col.label || col.key,
                type: isNum ? "number" : "text",
                isRequired,
                allowFocus: col.allowFocus,
                size: "xs",
                dependsOn: col.dependsOn,
                disabled: col.disabled,
                ...("decimalScale" in col && typeof col.decimalScale === "number"
                    ? { decimalScale: col.decimalScale }
                    : {}),
            };

            if (col.key === "ITEMID" || col.key === "PUREID")
                return { ...base, type: "combobox", collection: itemsCollection || { items: [] }, isRequired: true };

            // if (col.key === "WASTYPE")
            //     return { ...base, type: "select", collection: wastypecollection, isRequired: true, defaultValue: "TOUCH" };

            if (!isIssue && ["NETWT", "PUREWT"].includes(col.key))
                return { ...base, type: "calculated", disabled: true };

            if (isIssue && ["PUREWT", "APUREWT"].includes(col.key))
                return { ...base, type: "calculated", disabled: true };

            if (!isIssue && col.key === "STNAMT")
                return { ...base, type: "calculated", disabled: true };

            if (!isIssue && col.key === "TOUCH" && transactionType === "PU") 
                return { ...base, disabled : true };

            return base;
        });
    }, [tableCols, itemsCollection, isIssue, wastypecollection, numericFields]);

    // ── ExcelGrid columns ──────────────────────────────────────────────────────
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

        if (isFirstSyncRef.current) {
            // ── Initial load: full replace ────────────────────────────────────
            isFirstSyncRef.current = false;
            const converted = rows.map((r) => recalcRow({ ...r }, !!isIssue));
            if (converted.length === 0) converted.push(makeEmptyRow(formFields, !!isIssue));
            setDraftRows(converted);
            rows.forEach((r) => committedRowIdsRef.current.add(r.__rowId));
            prevRowIdsRef.current = new Set(rows.map((r) => r.__rowId));
            return;
        }

        // ── Detect transaction switch ─────────────────────────────────────────
        // If NONE of the incoming parent rows exist in our current draft,
        // it means the parent swapped to a completely different transaction.
        const currentDraftIds = new Set(draftRowsRef.current.map((r) => r.__rowId));
        const hasOverlap = rows.some((r) => currentDraftIds.has(r.__rowId));
        const isTransactionSwitch = !hasOverlap && rows.length > 0;

        if (isTransactionSwitch) {
            // Full reset — treat exactly like first sync
            committedRowIdsRef.current = new Set();
            appliedPureIdRef.current = {};
            const converted = rows.map((r) => recalcRow({ ...r }, !!isIssue));
            if (converted.length === 0) converted.push(makeEmptyRow(formFields, !!isIssue));
            setDraftRows(converted);
            rows.forEach((r) => committedRowIdsRef.current.add(r.__rowId));
            prevRowIdsRef.current = new Set(rows.map((r) => r.__rowId));
            return;
        }

        // ── Normal incremental sync (same transaction) ────────────────────────
        setDraftRows((prev) => {
            const parentMap = new Map(rows.map((r) => [r.__rowId, r]));
            const localMap = new Map(prev.map((r) => [r.__rowId, r]));

            const next: Record<string, any>[] = [];
            prev.forEach((localRow) => {
                if (parentMap.has(localRow.__rowId)) {
                    // Exists in both — local edits win, but pull parent-only fields
                    next.push(recalcRow(
                        { ...parentMap.get(localRow.__rowId)!, ...localRow },
                        !!isIssue
                    ));
                } else {
                    // Keep only uncommitted (blank/new) local rows.
                    // Committed rows no longer in parent were externally deleted — drop them.
                    const isUncommitted = !committedRowIdsRef.current.has(localRow.__rowId);
                    if (isUncommitted) next.push(localRow);
                }
            });

            // Add parent rows that appeared externally (e.g. initialFormData load)
            rows.forEach((r) => {
                if (!localMap.has(r.__rowId)) {
                    next.push(recalcRow({ ...r }, !!isIssue));
                    committedRowIdsRef.current.add(r.__rowId);
                }
            });

            if (next.length === 0) return [makeEmptyRow(formFields, !!isIssue)];
            return next;
        });

        prevRowIdsRef.current = new Set(rows.map((r) => r.__rowId));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows]); // intentionally narrow

    // ── Keep committedRowIds in sync when parent rows change (e.g. initial load)
    useEffect(() => {
        rows.forEach((r) => committedRowIdsRef.current.add(r.__rowId));
    }, [rows]);

    // ── Safety reset when transactionType prop changes ─────────────────────────
    const prevTransactionTypeRef = useRef(transactionType);
    useEffect(() => {
        if (prevTransactionTypeRef.current !== transactionType) {
            prevTransactionTypeRef.current = transactionType;
            // Force the next rows sync to behave like a first sync
            isFirstSyncRef.current = true;
        }
    }, [transactionType]);


    // ── Add empty row ──────────────────────────────────────────────────────────
    const handleAddRow = useCallback(() => {
        setDraftRows((prev) => [...prev, makeEmptyRow(formFields, !!isIssue)]);
    }, [formFields, isIssue]);

    const lastSyncedRowsRef = useRef<Record<string, string>>({});
    // key = __rowId, value = JSON.stringify of last synced state

    useEffect(() => {
        const current = draftRowsRef.current;

        current.forEach((row, rowIndex) => {

            

            const isMeaningful = !!(row.ITEMID || row.PUREID || row.WT || row.GRSWT);
            if (!isMeaningful) return;

            const isCommitted = committedRowIdsRef.current.has(row.__rowId);

            // Serialize row for change detection (exclude internal meta)
            const { __rowId, ...syncableFields } = row;
            const rowHash = JSON.stringify(syncableFields);
            const lastHash = lastSyncedRowsRef.current[row.__rowId];
            const hasChanged = rowHash !== lastHash;

            if (!hasChanged) return; // nothing changed for this row — skip

            // Mark as synced
            lastSyncedRowsRef.current[row.__rowId] = rowHash;

            console.log(current, row,rowIndex,'currentrowIndeds');

            if (isCommitted) {
                // Already in store — push all fields including _stones/_miscCharges
                Object.keys(row).forEach((field) => {
                    if (field === "__rowId") return;
                    onUpdateRow(rowIndex, field, row[field]);
                });
            } else {
                // New row — commit to store
                committedRowIdsRef.current.add(row.__rowId);
                onAddRow(row);
            }
        });

        // Clean up hashes for deleted rows
        const currentIds = new Set(current.map((r) => r.__rowId));
        Object.keys(lastSyncedRowsRef.current).forEach((id) => {
            if (!currentIds.has(id)) delete lastSyncedRowsRef.current[id];
        });
    }, [draftRows]);




    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const errors = useMemo<Record<string, string>>(() => {
        const errs: Record<string, string> = {};
        rows.forEach((row, ri) => {
            if (row.ITEMID) {
                
                if (!row.TOUCH || row.TOUCH === "")
                    errs[`${ri}_TOUCH`] = "TOUCH is required";
                if( row.TOUCH <= row.ATOUCH && row.ITEMTYPE === "PR") 
                    errs[`${ri}_TOUCH`] = "TOUCH must be a number";
                const weight = Number(row.GRSWT);
                if (!row.GRSWT || isNaN(weight) || weight < 0)
                    errs[`${ri}_GRSWT`] = "GRS Weight must be > 0";
            }

        });
        return errs;
    }, [rows]);

    console.log(errors,'errors')

    // ── Delete row ─────────────────────────────────────────────────────────────
    // FIX: onRemoveRow (Zustand store update) must NOT be called inside
    // setDraftRows updater — that runs during render and causes the
    // "setState while rendering different component" error.
    // Solution: capture whether the row was committed BEFORE calling setDraftRows,
    // then call onRemoveRow AFTER the local state update via a ref-flush.
    const handleDeleteRow = useCallback((rowIndex: number) => {
        const row = draftRowsRef.current[rowIndex];
        if (!row) return;

        const isBlank = !row.ITEMID && !row.PUREID && !row.WT && !row.GRSWT;
        if (!isBlank && !window.confirm("Delete this row?")) return;

        // Determine if committed BEFORE touching state
        const wasCommitted = parentRowsRef.current.some((r) => r.__rowId === row.__rowId);
        const rowIdToRemove = row.__rowId;

        // Clean up tracking refs immediately (safe — not during render)
        committedRowIdsRef.current.delete(rowIdToRemove);
        delete appliedPureIdRef.current[rowIdToRemove];

        // Update local state
        setDraftRows((prev) => {
            const next = prev.filter((_, i) => i !== rowIndex);
            if (next.length === 0) return [makeEmptyRow(formFields, !!isIssue)];
            return next;
        });

        // Schedule parent store notification to run AFTER render, never inside setState
        if (wasCommitted) {
            pendingParentCallRef.current = () => onRemoveRow(rowIdToRemove);
        }
    }, [formFields, isIssue, onRemoveRow]);

    // ── Cell change → recalc locally, then notify parent OUTSIDE setState ─────
    const handleCellChange = useCallback((rowIndex: number, colKey: string, value: any) => {
        // ── Block navigation if TOUCH is required but missing ─────────────────
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
                return; // ← block, don't update state
            }

            // Touch entered manually — clear the not-found flag
            if (value) {
                touchNotFoundRef.current.delete(rowId);
            }
        }

        // ── Block moving past ITEMID/PUREID if touch not yet resolved ─────────
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

            if (isCommitted) shouldUpdate = true;
            else if (isMeaningful) shouldAdd = true;

            return next;
        });

        pendingParentCallRef.current = () => {
            if (!rowAfterUpdate) return;
            if (shouldAdd && !committedRowIdsRef.current.has(rowAfterUpdate!.__rowId)) {
                committedRowIdsRef.current.add(rowAfterUpdate!.__rowId);
                onAddRow(rowAfterUpdate);
            } else if (shouldUpdate) {
                onUpdateRow(rowIndex, colKey, value);
            }
        };
        setTouched(prev => ({ ...prev, [`${rowIndex}_${colKey}`]: true }));
    }, [isIssue, onAddRow, onUpdateRow]);

    // ── Flush pending parent calls after every render (safe — runs after paint)
    // This ensures Zustand / parent store updates never happen during React's
    // render phase, eliminating the "setState while rendering" warning entirely.
    useEffect(() => {
        if (pendingParentCallRef.current) {
            const call = pendingParentCallRef.current;
            pendingParentCallRef.current = null;
            call();
        }
    });

    // ── Pure gold data — only apply TOUCH/ATOUCH when PUREID actually changes ──
    const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);

    const activeRowPureId = activeRowIndex !== null ? draftRows[activeRowIndex]?.PUREID : undefined;
    const activeRowItemId = activeRowIndex !== null ? draftRows[activeRowIndex]?.ITEMID : undefined;
    const activeRowId = activeRowIndex !== null ? draftRows[activeRowIndex]?.__rowId : undefined;
    const activeRowDetail =  draftRowsRef.current.find(r => r.__rowId === activeRowId) ;

    
    
    //TO SET THE TOUCH FOR PURE ID
    const { data: pureStockData ,isLoading : pureGoldLoading} = usePureGoldDataById(activeRowPureId);


    const shouldFetchTouch = !!activeRowItemId && !!acCode;
    const { data: touchData, isLoading: touchDataLoading } = useTouchByFilter(
        { ITEMID: Number(activeRowItemId), ACCODE: Number(acCode) },
        shouldFetchTouch  // ← enabled only when both exist
    );




    // ── Touch data effect ─────────────────────────────────────────────
    useEffect(() => {
        if (activeRowIndex === null || !activeRowId || !activeRowItemId) return;
        if (touchDataLoading) return;

        const key = `${activeRowId}::${activeRowItemId}`;
        if (appliedItemIdRef.current[activeRowId] === key) return;

        if (!touchData || !touchData.TOUCH) {
            touchNotFoundRef.current.add(activeRowId);
            // ✅ Don't mark as applied — let it retry when data arrives
            setTimeout(() => {
                toaster.create({
                    title: "No Touch Found",
                    description: "No touch configured for this item & customer. Please enter manually.",
                    type: "warning",
                    duration: 3000,
                });
            }, 0);
            return;
        }

        // ✅ Only mark as applied when we actually have data
        appliedItemIdRef.current[activeRowId] = key;
        touchNotFoundRef.current.delete(activeRowId);

        const touch = touchData.TOUCH;
        const calMode = touchData.CALMODE || "NETWT";

        setCalculationMode(calMode); // ✅ no longer in deps so no loop

        const rowIndex = activeRowIndex;

        setDraftRows((prev) => {
            const next = [...prev];
            const row = { ...next[rowIndex], TOUCH: touch, ATOUCH: touch, CAL_MODE: calMode };
            recalcRow(row, false);
            next[rowIndex] = row;
            return next;
        });

        setTimeout(() => {
            toaster.create({
                title: "Touch Applied",
                description: `Touch ${touch} applied for selected item.`,
                type: "success",
                duration: 2000,
            });
        }, 0);

        const wasCommitted = committedRowIdsRef.current.has(activeRowId);
        if (wasCommitted) {
            pendingParentCallRef.current = () => {
                onUpdateRow(rowIndex, "TOUCH", touch);
                onUpdateRow(rowIndex, "ATOUCH", touch);
                onUpdateRow(rowIndex, "CAL_MODE", calMode);
            };
        }
    }, [touchData, touchDataLoading]); // ✅ no calculationMode



    // ── Pure gold effect (issue) ──────────────────────────────────────────────
    useEffect(() => {
        if (activeRowIndex === null || !activeRowId || !activeRowPureId) return;
        if (!pureStockData) return;

        const key = `${activeRowId}::${activeRowPureId}`;
        if (appliedPureIdRef.current[activeRowId] === key) return;
        appliedPureIdRef.current[activeRowId] = key;

        const rowIndex = activeRowIndex;

        if (!pureStockData.actualTouch) {
            touchNotFoundRef.current.add(activeRowId);

            // ✅ Defer toast
            setTimeout(() => {
                toaster.create({
                    title: "No Touch Found",
                    description: "No touch found for this pure gold item. Please enter manually.",
                    type: "warning",
                    duration: 3000,
                });
            }, 0);
            return;
        }

        touchNotFoundRef.current.delete(activeRowId);
        const touch = pureStockData.actualTouch;
     
        setDraftRows((prev) => {
            const next = [...prev];
            const row = { ...next[rowIndex], TOUCH: touch, ATOUCH: touch };
            recalcRow(row, !!isIssue ,);
            next[rowIndex] = row;
            return next;
        });

        // ✅ Defer toast
        setTimeout(() => {
            toaster.create({
                title: "Touch Applied",
                description: `Touch ${touch} applied from pure gold data.`,
                type: "success",
                duration: 2000,
            });
        }, 0);

        const wasCommitted = committedRowIdsRef.current.has(activeRowId);
        if (wasCommitted) {
            pendingParentCallRef.current = () => {
                onUpdateRow(rowIndex, "TOUCH", touch);
                onUpdateRow(rowIndex, "ATOUCH", touch);
            };
        }
    }, [pureStockData]);


    // ── Stone modal handlers ───────────────────────────────────────────────────
    const handleOpenStoneModal = useCallback((rowId: string, grsWeight: number) => {
        if (!grsWeight || grsWeight <= 0) {
            toaster.create({ title: "Enter GRSWT first", type: "warning" });
            return;
        }

        // ✅ Read fresh from store, not from stale local draftRows
        const freshRow = usePurchaseTransactionStore.getState().draftRows.find(
            (r) => r.__rowId === rowId
        );

        console.log(freshRow,'freshRow' ,rowId);
        console.log(usePurchaseTransactionStore.getState(),'usePurchaseTransactionStore')
        setStoneModalRowId(rowId);
        setCurrentGRSWT(grsWeight);
        setStoneModalInitialRows(freshRow?._stones || []); // ✅ set explicitly
        setIsStoneModalOpen(true);
    }, []);

 

    // ── Misc modal handlers ────────────────────────────────────────────────────
    const handleOpenMiscModal = useCallback((rowId: string) => {
        setMiscModalRowId(rowId);
        setIsMiscModalOpen(true);
    }, []);

    const miscModalRow = useMemo(
        () => draftRows.find((r) => r.__rowId === miscModalRowId),
        [draftRows, miscModalRowId]
    );
    console.log(miscModalRow,'miscModalRow')
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

    // ── Totals ─────────────────────────────────────────────────────────────────
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
        const { row, col, value, isEditing, isFocused, isError, onChange, onCommit, inputRef } = params;
        const field = formFields.find((f) => f.key === col.key);
        if (!field) return <span style={{ padding: "0 4px", fontSize: 11 }}>{value ?? ""}</span>;

        // ── Computed / read-only display ───────────────────────────────────────
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

        // ── STNWT — focus on cell opens stone modal ───────────────────────────
        if (col.key === "STNWT") {
            const stonesCount = (row._stones || []).length;
            return (
                <div
                    style={{ display: "flex", alignItems: "center", width: "100%", padding: "0 2px" }}
                    onFocus={() => handleOpenStoneModal(row.__rowId, parseFloat(row.GRSWT) || 0)}
                    onClick={() => handleOpenStoneModal(row.__rowId, parseFloat(row.GRSWT) || 0)}
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
                        <span style={{ fontSize: 10, color: "#805AD5", flexShrink: 0, paddingRight: 2 }}>
                            💎
                            {/* {stonesCount} */}
                        </span>
                    )}
                </div>
            );
        }

        // ── HMC — focus on cell opens other charges modal ─────────────────────
        if (col.key === "HMC") {
            const chargesCount = (row._miscCharges || []).length;
            return (
                <div
                    style={{ display: "flex", alignItems: "center", width: "100%", padding: "0 2px" }}
                    onFocus={() => handleOpenMiscModal(row.__rowId)}
                    onClick={() => handleOpenMiscModal(row.__rowId)}
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
                        <span style={{ fontSize: 10, color: "#C05621", flexShrink: 0, paddingRight: 2 }}>
                            📋
                            {/* {chargesCount} */}
                        </span>
                    )}
                </div>
            );
        }

        // ── STNAMT — derived from stones, read-only ────────────────────────────
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

        // ── TAGNO ─────────────────────────────────────────────────────────────
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

        // ── WASTYPE select ────────────────────────────────────────────────────
        // if (col.key === "WASTYPE") {
        //     return (
        //         <select
        //             ref={inputRef}
        //             value={value || "TOUCH"}
        //             onChange={(e) => onChange(e.target.value)}
        //             onKeyDown={(e) => {
        //                 if (e.key === "Enter") { e.preventDefault(); onCommit(); }
        //             }}
        //             style={{
        //                 width: "100%", height: 22, fontSize: 10, borderRadius: 3,
        //                 border: "1px solid transparent", outline: "none", padding: "0 4px",
        //             }}
        //         >
        //             {wastypecollection.items.map((opt) => (
        //                 <option key={opt.value} value={opt.value}>{opt.label}</option>
        //             ))}
        //         </select>
        //     );
        // }

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
        // if (isIssue && col.key === "TOUCH") {
        //     return (
        //         <CapitalizedInput
        //             field={col.key}
        //             value={value || ""}
        //             onChange={(_, v) => onChange(v)}
        //             type="number"
        //             isCapitalized
        //             size="xs"
        //             rounded="sm"
        //             decimalScale={field.decimalScale}
        //             inputRef={inputRef}
        //             onEnter={onCommit}
        //             noBorder
        //         />
        //     );
        // }

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
                disabled={col.disabled}
                
            />
        );
    }, [formFields, wastypecollection, isIssue, handleOpenStoneModal, handleOpenMiscModal]);

    // ── Colors ─────────────────────────────────────────────────────────────────
    const TYPE_COLORS: Record<string, string> = {
        PU: "#b7fff1", PR: "#ffc4c4", ISP: "#ffd9a4", REC: "#ffcafb",
    };
    const accentColor = {
        PU: "#2F855A", PR: "#C53030", ISP: "#DD6B20", REC: "#c729ba",
    }[transactionType ?? ""] ?? "#185FA5";

    const showTag = getIsTagEnabled(transactionType);

    useGlobalKey("Escape", () => setIsMiscModalOpen(false), "close-modal");

    // Committed (non-empty) rows for the badge count
    const committedRows = draftRows.filter((r) => !!(r.ITEMID || r.PUREID || r.WT || r.GRSWT));

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

                    <Badge
                        colorPalette={committedRows.length > 0 ? "green" : "gray"}
                        variant="subtle" fontSize="2xs" px={2}
                    >
                        {committedRows.length} item{committedRows.length !== 1 ? "s" : ""}
                    </Badge>
                  
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
                    errors={errors}
                    touched={touched}
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
                    // initialFocusCell={{ rowIndex: 0, colKey: isIssue ? "PUREID"  :"ITEMID" }}  // ✅ clean
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
                        
                                const stoneWtTotal = updatedStones.reduce((sum, r) => {
                                    const wt = Number(r.stoneWeight || 0);

                                    return sum + (r.stoneUnit === "c" ? wt / 5 : wt);
                                }, 0);
                                const stnAmtTotal = updatedStones.reduce(
                                    (sum, r) => sum + r.stoneAmount, 0
                                );

                                // Capture committed status BEFORE setState
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
                                        STNWT: stoneWtTotal?.toFixed(3),
                                        STNAMT: stnAmtTotal?.toFixed(2),
                                    }, !!isIssue);
                                }));

                                // Notify parent AFTER render via pending ref
                                if (stoneWasCommitted && stoneRowIndex >= 0) {
                                    pendingParentCallRef.current = () => {
                                        onUpdateRow(stoneRowIndex, "STNWT", stoneWtTotal?.toFixed(3));
                                        onUpdateRow(stoneRowIndex, "STNAMT", stnAmtTotal?.toFixed(2));
                                        onUpdateRow(stoneRowIndex, "_stones", updatedStones); // ← add this
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
                        maxW="700px" width="100%" maxH="90vh" overflow="auto"
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
                                console.log(updatedCharges,'updatedCharges');
                                const total = updatedCharges.reduce(
                                    (sum, c) => sum + (Number(c.finalAmount) || 0), 0
                                );

                                // Capture committed status BEFORE setState
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

                                // Notify parent AFTER render via pending ref
                                if (miscWasCommitted && miscRowIndex >= 0) {
                                    pendingParentCallRef.current = () => {
                                        onUpdateRow(miscRowIndex, "HMC", total.toFixed(2));
                                        onUpdateRow(miscRowIndex, "_miscCharges", updatedCharges); // ← add this
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
                            enteredPieces={miscModalRow?.PCS}
                        />
                    </Box>
                </Box>
            )}
        </Box>
    );
}