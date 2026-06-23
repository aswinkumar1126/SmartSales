"use client";

import React, {
    useMemo, useCallback, useState, useEffect, useRef,
} from "react";
import { useRouter } from "next/navigation";

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
import { ExcelGrid, ColumnDef, RenderCellParams } from "@/component/table/ExcelGrid";
import { useTouchByFilter } from "@/hooks/apiHooks/touch/useTouchMastData";
import { usePurchaseTransactionStore } from "@/store/purchase/usePurchaseTransactionStore";
import { calculateMiscChargeFinalAmount } from "@/hooks/Transaction/both/calculateMiscCharges";

import { useSoftControlById } from "@/hooks/apiHooks/softControl/useSoftControl";
// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Props ────────────────────────────────────────────────────────────────────
interface DraftTransactionTableProps {
    rows: any[];
    editingState: { rowId: string | null; transactionType: string | null };
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
        touch: number | null,
        options?: { excludeRowId?: string; isEditing?: boolean; originalWeight?: number; transactionTypeCode?: string }
    ) => number | null;
    onClear?: () => void;
    transactionType?: string;
    initialFormData?: any;
    getStockAvailability?: (
        id: string,
        touch: number | null,
        options?: { excludeRowId?: string; transactionTypeCode: string; isEditing?: boolean; originalWeight?: number }
    ) => any | undefined;
    otherChargesList: { label: string; value: string }[];
    otherChargesData: any;
    getAvailablePieces?: (
        id: string,
        touch: number | null,
        options?: { excludeRowId?: string; transactionTypeCode: string; isEditing?: boolean; originalPieces?: number }
    ) => any | undefined;
    handleTagChange: () => void;
    isTag: boolean;
    onTagNoLookup?: (tagNo: string) => void;
    acCode?: number;
    isTagedItem: (id: number) => boolean;
    onSaleReturnModal: {
        billParams: { ACCODE: number | undefined; ENTRYNO?: string; BILLDATE?: string; TAGNO?: string };
        onBillParamChange: (field: string, value: any) => void;
        billDetails: any[] | [];
        loading: boolean;
        showBillModal: boolean;
        handleBillShow: () => void;
    };
    isModifying?:boolean
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
    row.STN_PRESENT = "Y";   // default — will be updated when touch data arrives
    row.CAL_MODE = "NETWT";  // default — will be updated when touch data arrives
    return recalcRow(row, isIssue);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DraftTransactionTable({
    rows,
    editingState,
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
    isTagedItem,
    onSaleReturnModal,
    isModifying
}: DraftTransactionTableProps) {
    console.log(isEditing,'isEditing');
    console.log(transactionType,'transactionTypetransactionType');

    const router = useRouter();

    
    const { data: softControlData } = useSoftControlById('PU_HMC_FINALAMT');
    
    const usePcsBySoftControl = softControlData?.CTLTEXT === "Y";
    console.log(usePcsBySoftControl,'usePcsBySoftControl')
    

    // ── Zustand store ─────────────────────────────────────────────────────────
    const { addDraftRow, updateDraftRow, removeDraftRow } = usePurchaseTransactionStore();

    // ── Draft rows (local grid state — only for rendering, not source of truth) ─
    const [draftRows, setDraftRows] = useState<Record<string, any>[]>([]);
    const draftRowsRef = useRef(draftRows);
    useEffect(() => { draftRowsRef.current = draftRows; }, [draftRows]);

    // ── rowId-keyed tracking refs (no index dependency) ───────────────────────
    const committedRowIdsRef = useRef<Set<string>>(new Set());
    const pendingStoreCallRef = useRef<(() => void) | null>(null);
    const appliedPureIdRef = useRef<Record<string, string>>({});
    const appliedItemIdRef = useRef<Record<string, string>>({});
    const touchNotFoundRef = useRef<Set<string>>(new Set());
    const lastSyncedRowsRef = useRef<Record<string, string>>({});

    // ── Active row tracked by rowId (not index) ───────────────────────────────
    // We keep the index only for ExcelGrid's API, but all business logic uses rowId.
    const [activeRowId, setActiveRowId] = useState<string | null>(null);

    // Derive the active row object directly from draftRows by rowId
    const activeRow = useMemo(
        () => draftRows.find((r) => r.__rowId === activeRowId) ?? null,
        [draftRows, activeRowId]
    );
    // Derive index only when ExcelGrid needs it (e.g. focusAfterModal)
    const activeRowIndex = useMemo(
        () => draftRows.findIndex((r) => r.__rowId === activeRowId),
        [draftRows, activeRowId]
    );

    // ── Pull live STN_PRESENT and CAL_MODE from the store for the active row ──
    // This is the single source of truth — no extra local state needed.
    const activeStoreRow = usePurchaseTransactionStore(
        useCallback(
            (s) => s.draftRows.find((r) => r.__rowId === activeRowId) ?? null,
            [activeRowId]
        )
    );
    // STN_PRESENT: prefer store value (most up-to-date after touch fetch), fall back to local draft
    const activeStnPresent: boolean =
        activeStoreRow?.STN_PRESENT ?? activeRow?.STN_PRESENT ?? "N";

    console.log(activeStnPresent, activeStoreRow, activeRow,'activeRow');
    const activeCalMode: string =
        activeStoreRow?.CAL_MODE ?? activeRow?.CAL_MODE ?? "NETWT";

    // ── Modal state ───────────────────────────────────────────────────────────
    const [stoneModalRowId, setStoneModalRowId] = useState<string | null>(null);
    const [miscModalRowId, setMiscModalRowId] = useState<string | null>(null);
    const [currentGRSWT, setCurrentGRSWT] = useState<number>(0);
    const [isStoneModalOpen, setIsStoneModalOpen] = useState(false);
    const [stoneModalInitialRows, setStoneModalInitialRows] = useState<any[]>([]);
    const [isMiscModalOpen, setIsMiscModalOpen] = useState(false);
    const [modalTrigger, setModalTrigger] = useState(0);
    const [lastClosedModal, setLastClosedModal] = useState<'stoneMaster' | 'hmc' | null>(null);

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
        return isTag && transactionType === "PR"
            ? ["TAGNO", "ITEMID", "PCS", "GRSWT", "STNWT", "NETWT", "WASTYPE", "WASPER",
                "WASTAGE", "TOUCH", "PUREWT", "HMC", "MC", "STNAMT", "DESCRIPTION"]
            : ["ITEMID", "PCS", "GRSWT", "STNWT", "NETWT", "WASTYPE", "WASPER",
                "WASTAGE", "TOUCH", "PUREWT", "HMC", "MC", "STNAMT", "DESCRIPTION"];
    }, [isIssue, isTag, transactionType]);

    const baseColumns = isIssue ? issueColumns : purchaseColumns(isTag);
    const colMap = useMemo(() => new Map(baseColumns.map((c) => [c.key, c])), [baseColumns]);
    const tableCols = useMemo(
        () => orderedKeys.map((k) => colMap.get(k)).filter(Boolean) as any[],
        [orderedKeys, colMap]
    );

    // ── formFields — STNWT disabled driven by activeStnPresent from store ─────
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
                dependsOn: col.dependsOn,
                disabled: col.disabled,
                ...("decimalScale" in col && typeof col.decimalScale === "number"
                    ? { decimalScale: col.decimalScale }
                    : {}),
            };

            if (col.key === "ITEMID" || col.key === "PUREID")
                return { ...base, type: "combobox", collection: itemsCollection || { items: [] }, isRequired: true };
            if (!isIssue && ["NETWT", "PUREWT"].includes(col.key))
                return { ...base, type: "calculated", disabled: true };
            if (isIssue && ["PUREWT", "APUREWT"].includes(col.key))
                return { ...base, type: "calculated", disabled: true };
            if (!isIssue && col.key === "STNAMT")
                return { ...base, type: "calculated", disabled: true };
            if (isIssue && col.key === "ATOUCH" && transactionType === "ISP")
                return { ...base, disabled: true };

            // ── STNWT: disabled when the active row's item has no stones ─────
            // activeStnPresent comes from the Zustand store (updated when touch data loads)
            if (!isIssue && col.key === "STNWT")
                return { ...base, disabled: !activeStnPresent };

            return base;
        });
    // activeStnPresent intentionally in deps — STNWT disabled state must react to store updates
    }, [tableCols, itemsCollection, isIssue, numericFields, activeStnPresent, transactionType]);

    const gridColumns = useMemo<ColumnDef[]>(() => {
        return formFields.map((f): ColumnDef => {
            const baseCol = tableCols.find((c) => c.key === f.key);
            return {
                key: f.key,
                label: f.label || f.key,
                width: baseCol?.width || 80,
                align: "right",
                required: f.isRequired,
                decimalScale: f.decimalScale,
                computed: f.type === "calculated" || f.disabled === true,
                disabled: f.type === "calculated" || f.disabled === true,
            };
        });
    }, [formFields, tableCols]);

    // ── Sync parent rows → local draftRows ────────────────────────────────────
    const parentRowsRef = useRef(rows);
    const isFirstSyncRef = useRef(true);
    const prevRowIdsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        parentRowsRef.current = rows;

        if (isFirstSyncRef.current) {
            isFirstSyncRef.current = false;
            const converted = rows.map((r) => recalcRow({ ...r }, !!isIssue));
            if (converted.length === 0) converted.push(makeEmptyRow(formFields, !!isIssue));
            setDraftRows(converted);
            rows.forEach((r) => committedRowIdsRef.current.add(r.__rowId));
            prevRowIdsRef.current = new Set(rows.map((r) => r.__rowId));
            return;
        }

        const currentDraftIds = new Set(draftRowsRef.current.map((r) => r.__rowId));
        const hasOverlap = rows.some((r) => currentDraftIds.has(r.__rowId));
        const isTransactionSwitch = !hasOverlap && rows.length > 0;

        if (isTransactionSwitch) {
            committedRowIdsRef.current = new Set();
            appliedPureIdRef.current = {};
            appliedItemIdRef.current = {};
            const converted = rows.map((r) => recalcRow({ ...r }, !!isIssue));
            if (converted.length === 0) converted.push(makeEmptyRow(formFields, !!isIssue));
            setDraftRows(converted);
            rows.forEach((r) => committedRowIdsRef.current.add(r.__rowId));
            prevRowIdsRef.current = new Set(rows.map((r) => r.__rowId));
            return;
        }

        setDraftRows((prev) => {
            const parentMap = new Map(rows.map((r) => [r.__rowId, r]));
            const localMap = new Map(prev.map((r) => [r.__rowId, r]));
            const next: Record<string, any>[] = [];

            prev.forEach((localRow) => {
                if (parentMap.has(localRow.__rowId)) {
                    next.push(recalcRow({ ...parentMap.get(localRow.__rowId)!, ...localRow }, !!isIssue));
                } else {
                    const isUncommitted = !committedRowIdsRef.current.has(localRow.__rowId);
                    if (isUncommitted) next.push(localRow);
                }
            });

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

    // ── Flush pending store calls after every render ──────────────────────────
    useEffect(() => {
        if (pendingStoreCallRef.current) {
            const call = pendingStoreCallRef.current;
            pendingStoreCallRef.current = null;
            call();
        }
    });

    // ── Store write helpers (rowId-keyed, no index) ───────────────────────────

    const commitNewRow = useCallback((row: Record<string, any>) => {

        console.log(row,'commitedNewRow')

        const isTagged = row.STOCKTYPE === "T" ? isTagedItem(Number(row.ITEMID)) : false;
        addDraftRow({
            ...row,
            __rowId: row.__rowId,
            __isTaged: isTagged,
            STN_PRESENT: row.STN_PRESENT ?? "N",
            ITEM_TYPE: isTagged ? "TAGGED" : "NON_TAGGED",
            CAL_MODE: row.CAL_MODE ?? "NETWT",
            __isNew: false,
            __previewSno:
                usePurchaseTransactionStore.getState().draftRows.filter(
                    (r) => r.TRANSACTION_TYPE === transactionType
                ).length + 1,
            TRANSACTION_TYPE: transactionType ?? "",
            ISEDITABLE : true,

        });
        committedRowIdsRef.current.add(row.__rowId);
    }, [addDraftRow, isTagedItem, transactionType]);

    const commitRowUpdate = useCallback((rowId: string, updates: Record<string, any>) => {
        updateDraftRow(rowId, updates);
    }, [updateDraftRow]);

    const commitFieldUpdate = useCallback((rowId: string, field: string, value: any) => {
        updateDraftRow(rowId, { [field]: value });
    }, [updateDraftRow]);

    // ── draftRows → store sync (rowId-keyed, skips unchanged rows) ───────────
    useEffect(() => {
        const current = draftRowsRef.current;

        current.forEach((row) => {
            const isMeaningful = !!(row.ITEMID || row.PUREID || row.WT || row.GRSWT);
            if (!isMeaningful) return;

            const isCommitted = committedRowIdsRef.current.has(row.__rowId);
            const { __rowId, ...syncableFields } = row;
            const rowHash = JSON.stringify(syncableFields);
            const lastHash = lastSyncedRowsRef.current[row.__rowId];
            if (rowHash === lastHash) return;

            lastSyncedRowsRef.current[row.__rowId] = rowHash;

            if (isCommitted) {
                commitRowUpdate(row.__rowId, syncableFields);
            } else {
                commitNewRow(row);
            }
        });

        // Clean up hashes for deleted rows
        const currentIds = new Set(current.map((r) => r.__rowId));
        Object.keys(lastSyncedRowsRef.current).forEach((id) => {
            if (!currentIds.has(id)) delete lastSyncedRowsRef.current[id];
        });
    }, [draftRows, commitNewRow, commitRowUpdate]);

    // ── Add / Delete row (rowId-driven, no index for store ops) ──────────────
    const isRowEmpty = (row: any) => {
    return (
        !row.ITEMID &&
        !row.PUREID &&
        !row.WT &&
        !row.GRSWT &&
        !row.PCS
    );
};  
const handleAddRow = useCallback(() => {
    setDraftRows((prev) => {

        const hasPendingEmptyRow = prev.some(isRowEmpty);

        if (hasPendingEmptyRow) {
            return prev;
        }

        return [...prev, makeEmptyRow(formFields, !!isIssue)];
    });
}, [formFields, isIssue]);

    const handleDeleteRow = useCallback((rowIndex: number) => {
        const row = draftRowsRef.current[rowIndex];
        if (!row) return;

        console.log(isEditing, row, transactionType,'deleteRow');
        if (isEditing && transactionType=== "PU" && !row.ISEDITABLE) return;

        console.log(isEditing, row.ISEDITABLE ,'isEditable');

        const isBlank = !row.ITEMID && !row.PUREID && !row.WT && !row.GRSWT;
        if (!isBlank && !window.confirm("Delete this row?")) return;

        const wasCommitted = committedRowIdsRef.current.has(row.__rowId);
        const rowIdToRemove = row.__rowId;

        committedRowIdsRef.current.delete(rowIdToRemove);
        delete appliedPureIdRef.current[rowIdToRemove];
        delete appliedItemIdRef.current[rowIdToRemove];
        delete lastSyncedRowsRef.current[rowIdToRemove];
        touchNotFoundRef.current.delete(rowIdToRemove);

        // Clear active row if it was deleted
        if (activeRowId === rowIdToRemove) setActiveRowId(null);

        setDraftRows((prev) => {
            const next = prev.filter((_, i) => i !== rowIndex);
            return next.length === 0 ? [makeEmptyRow(formFields, !!isIssue)] : next;
        });

        if (wasCommitted) {
            pendingStoreCallRef.current = () => removeDraftRow(rowIdToRemove);
        }
    }, [formFields, isIssue, removeDraftRow, activeRowId]);

    // ── Cell change (rowId-keyed internally, index only for grid API) ─────────
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const handleCellChange = useCallback((rowIndex: number, colKey: string, value: any) => {
        // Resolve rowId from index at the moment of the change (avoids stale closure)
        const rowId = draftRowsRef.current[rowIndex]?.__rowId;
        if (!rowId) return;

        if (colKey === "TOUCH") {
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

        setDraftRows((prev) => {
            return prev.map((r) => {

                if (r.__rowId !== rowId) return r;

                const updated = { ...r, [colKey]: value };

                if (colKey === "WT") updated.AWT = value;

                if (colKey === "TOUCH" && transactionType === "REC") {
                    updated.ATOUCH = value;
                }

                let recalculatedRow = recalcRow(updated, !!isIssue);

                // ✅ PCS → recalculate HMC
                if (colKey === "PCS") {

                    const pcs = Number(value || 0);

                    const updatedCharges = (recalculatedRow._miscCharges || []).map((c: any) => {

                        const isHmc =
                            String(c.chargeName || "")
                                .trim()
                                .toUpperCase() === "HMC";

                        return {
                            ...c,
                            finalAmount:
                                isHmc && usePcsBySoftControl 
                                    ? Number(c.amount || 0) * pcs
                                    : Number(c.amount || 0),
                        };
                    });

                    const hmcTotal = updatedCharges.reduce(
                        (sum: number, c: any) =>
                            sum + Number(c.finalAmount || 0),
                        0
                    );

                    recalculatedRow = {
                        ...recalculatedRow,
                        _miscCharges: updatedCharges,
                        HMC: hmcTotal.toFixed(2),
                    };
                }

                return recalculatedRow;
            });
        });

        setTouched((prev) => ({ ...prev, [`${rowId}_${colKey}`]: true }));
    }, [isIssue, transactionType]);

    // ── Active row change — ExcelGrid calls with { rowIndex, colKey } ─────────
    const handleActiveChange = useCallback(
        (coord: { rowIndex: number; colKey: string } | null) => {
            if (coord === null) {
                setActiveRowId(null);
                return;
            }
            const row = draftRowsRef.current[coord.rowIndex];
            setActiveRowId(row?.__rowId ?? null);
        },
        []
    );

    // ── Fetch hooks — driven by activeRow fields (not index) ──────────────────
    const activeRowPureId = activeRow?.PUREID;
    const activeRowItemId = activeRow?.ITEMID;

    const { data: pureStockData } = usePureGoldDataById(activeRowPureId);

    const shouldFetchTouch = !!activeRowItemId && !!acCode;

    console.log(shouldFetchTouch, activeRowItemId, acCode, 'shouldFetchTouch')
    const { data: touchData, isLoading: touchDataLoading } = useTouchByFilter(
        { ITEMID: Number(activeRowItemId), ACCODE: Number(acCode) },
        shouldFetchTouch
    );

  useEffect(() => {
    if (!activeRowId || !activeRowItemId) return;
    if (touchDataLoading || isEditing) return;

      console.log(touchData,'touchData');

    const key = `${activeRowId}::${activeRowItemId}`;

    const touch = touchData?.TOUCH;
    const calMode = touchData?.CALMODE || "NETWT";
    const stnPresent = touchData?.STNPRESENT === "Y";
    const hmcAmount = Number(touchData?.HMCAMT ?? 0);

    const defaultHmcCharge =
        hmcAmount > 0
            ? [{
                  draftRowId: activeRowId,
                  chargeId: "1",
                  chargeName: "HMC",
                  amount: hmcAmount.toString(),
                  finalAmount: hmcAmount.toString(),
              }]
            : [];

    const existingRow = draftRows.find(
        r => r.__rowId === activeRowId
    );

   

    const alreadyApplied =
        existingRow?.TOUCH  &&
        existingRow?.CAL_MODE 
        // existingRow?.STN_PRESENT  

          // existingRow?.ATOUCH === touch &&
        // Number(existingRow?.HMC || 0) === hmcAmount;

         console.log(alreadyApplied ,'existingRow');

    // THIS is the real protection
    if (alreadyApplied) {
        appliedItemIdRef.current[activeRowId] = key;
        return;
    }

    // optional optimization only
    if (appliedItemIdRef.current[activeRowId] === key) {
        return;
    }

    appliedItemIdRef.current[activeRowId] = key;

    setDraftRows(prev =>
        prev.map(r => {
            if (r.__rowId !== activeRowId) return r;

            return recalcRow(
                {
                    ...r,
                    TOUCH: touch,
                    ATOUCH: touch,
                    CAL_MODE: calMode,
                    STN_PRESENT: stnPresent,
                    HMC: hmcAmount,
                    _miscCharges: defaultHmcCharge,
                },
                false
            );
        })
    );

    if (committedRowIdsRef.current.has(activeRowId)) {
        pendingStoreCallRef.current = () =>
            commitRowUpdate(activeRowId, {
                TOUCH: touch,
                ATOUCH: touch,
                CAL_MODE: calMode,
                STN_PRESENT: stnPresent,
                HMC: hmcAmount.toFixed(2),
                _miscCharges: defaultHmcCharge,
            });
    }
}, [
    touchData,
    touchDataLoading,
    activeRowId,
    activeRowItemId,
    isEditing,
    draftRows,
]);

   // ── Pure gold effect — writes directly to store by rowId ─────────────────
useEffect(() => {
    if (!activeRowId || !activeRowPureId) return;
    if (!pureStockData) return;
    if (isEditing) return;

    const key = `${activeRowId}::${activeRowPureId}`;

    // already processed same item
    if (appliedPureIdRef.current[activeRowId] === key) return;

    const capturedRowId = activeRowId;

    if (!pureStockData.actualTouch) {
        touchNotFoundRef.current.add(capturedRowId);

        setTimeout(() => {
            toaster.create({
                title: "No Touch Found",
                description:
                    "No touch found for this pure gold item. Please enter manually.",
                type: "warning",
                duration: 3000,
            });
        }, 0);

        appliedPureIdRef.current[activeRowId] = key;
        return;
    }

    touchNotFoundRef.current.delete(capturedRowId);

    const touch = pureStockData.actualTouch;
    
    // check existing row values before updating
    const existingRow = draftRows.find(
        (r) => r.__rowId === capturedRowId
    );

    const alreadyApplied =
        existingRow?.TOUCH > 0 &&
        existingRow?.ATOUCH > 0;

    // skip everything if already applied
    if (alreadyApplied) {
        appliedPureIdRef.current[activeRowId] = key;
        return;
    }

    appliedPureIdRef.current[activeRowId] = key;

    // local state update
    setDraftRows((prev) =>
        prev.map((r) => {
            if (r.__rowId !== capturedRowId) return r;

            return recalcRow(
                {
                    ...r,
                    TOUCH: touch,
                    ATOUCH: touch,
                },
                !!isIssue
            );
        })
    );

    // zustand store update
    if (committedRowIdsRef.current.has(capturedRowId)) {
        pendingStoreCallRef.current = () =>
            commitRowUpdate(capturedRowId, {
                TOUCH: touch,
                ATOUCH: touch,
            });
    }

    // toaster
    setTimeout(() => {
        toaster.create({
            title: "Touch Applied",
            description: `Touch ${touch} applied from pure gold data.`,
            type: "success",
            duration: 1500,
        });
    }, 0);
}, [
    pureStockData,
    activeRowId,
    activeRowPureId,
    isIssue,
    isEditing,
    draftRows,
]);

    // ── Stone modal ───────────────────────────────────────────────────────────
    const handleOpenStoneModal = useCallback((rowId: string, grsWeight: number) => {
        if (!grsWeight || grsWeight <= 0) {
            toaster.create({ title: "Enter GRSWT first", type: "warning" });
            return;
        }
        const freshRow = usePurchaseTransactionStore.getState().draftRows.find((r) => r.__rowId === rowId);
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

    const otherChargesInitialRows = useMemo(
        () => miscModalRow?._miscCharges || [],
        [miscModalRow]
    );

    // ── Tag lookup ─────────────────────────────────────────────────────────────
    const handleTagNoKeyDown = async () => {
        if (!tagNo) return;
        try {
            await onTagNoLookup?.(tagNo);
            setTagNo("");
        } catch {
            toaster.create({ title: "Error", description: "Failed to process tag", type: "error" });
        }
    };

    // ── Errors (rowId-keyed keys for display) ─────────────────────────────────
    const errors = useMemo<Record<string, string>>(() => {
        const errs: Record<string, string> = {};
        rows.forEach((row) => {
            const id = row.__rowId;
            if (row.ITEMID) {
                if (!row.TOUCH || row.TOUCH === "")
                    errs[`${id}_TOUCH`] = "TOUCH is required";
                if (row.TOUCH <= row.ATOUCH && row.ITEMTYPE === "PR")
                    errs[`${id}_TOUCH`] = "TOUCH must be a number";
                const weight = Number(row.GRSWT);
                if (!row.GRSWT || isNaN(weight) || weight < 0)
                    errs[`${id}_GRSWT`] = "GRS Weight must be > 0";
            }
        });
        return errs;
    }, [rows]);

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

    const tranEditing = isEditing ;

    // ── Cell renderer ─────────────────────────────────────────────────────────
    const renderCell = useCallback((params: RenderCellParams) => {
        const { row, col, value, isEditing, isFocused, onChange, onCommit, inputRef } = params;

        console.log(row,'renderingRow');

        const field = formFields.find((f) => f.key === col.key);
        const shouldDisableOnEditing = !row.ISEDITABLE && row.__isTaged;



        console.log( shouldDisableOnEditing,'shouldDisableOnEditing')
        // console.log(shouldDisableOnEditing, row,'shouldDisableOnEditing');

        // ── Resolve item name: prefer stored ITEMNAME, fall back to collection lookup ──
        const itemName = row.ITEMNAME
            || itemsCollection?.items?.find(
                (i: { label: string; value: string }) => i.value === row.ITEMID?.toString()
            )?.label
            || row.PURENAME
            || itemsCollection?.items?.find(
                (i: { label: string; value: string }) => i.value === row.PUREID?.toString()
            )?.label
            || value
            || "";
        

        if (!field) return <span style={{ padding: "0 4px", fontSize: 11 }}>{value ?? ""}</span>;

        if (col.computed || col.disabled ) {
            let displayValue = value ?? "";
            if (col.decimalScale) displayValue = Number(value || 0).toFixed(col.decimalScale);
            return (
                <span style={{ padding: "0 6px", fontSize: 11, color: "#555", width: "100%", display: "block", textAlign: col.align || "left" }}>
                    {displayValue}
                </span>
            );
        }
        const items = field.collection?.items || [];

    

        if (col.key === "STNWT") {
            // Per-row STN_PRESENT check: use this specific row's value (not just the active row)
            // so every row in the grid respects its own item's stone config.
            const rowStnPresent = row.STN_PRESENT || false;
            const isStnDisabled = !rowStnPresent;
            const stonesCount = (row._stones || []).length;

            if (isStnDisabled) {
                // Render as a computed/disabled cell — visually dimmed, not clickable
                return (
                    <span style={{ padding: "0 6px", fontSize: 11, color: "#aaa", width: "100%", display: "block", textAlign: "right", cursor: "not-allowed" }}>
                        {value || "0.000"}
                    </span>
                );
            }

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
                        noBorder
                    />
                    {stonesCount > 0 && (
                        <span style={{ fontSize: 10, color: "#805AD5", flexShrink: 0, paddingRight: 2 }}>💎</span>
                    )}
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
                        field={col.key}
                        value={value || ""}
                        onChange={(_, v) => onChange(v)}
                        type="number"
                        isCapitalized={false}
                        size="xs"
                        rounded="sm"
                        decimalScale={2}
                        inputRef={inputRef}
                        noBorder
                        disabled={shouldDisableOnEditing && tranEditing}
                    />
                    {chargesCount > 0 && (
                        <span style={{ fontSize: 10, color: "#C05621", flexShrink: 0, paddingRight: 2 }}>📋</span>
                    )}
                </div>
            );
        }

        if (col.key === "STNAMT") {
            const stonesTotal = (row._stones || []).reduce(
                (s: number, st: any) => s + (Number(st.stoneAmount) || 0), 0
            );
            return (
                <span style={{ padding: "0 6px", fontSize: 11, color: "#333", width: "100%", display: "block", textAlign: "right" }}>
                    {stonesTotal > 0 ? stonesTotal : value || ""}
                </span>
            );
        }

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
                    noBorder
                    disabled
                />
            );
        }
        if (col.key === "ITEMID" || col.key === "PUREID") {
            const items = field.collection?.items || [];
 
            if (col.key === "ITEMID" && shouldDisableOnEditing) {
                return (
                    <span style={{
                        padding: "0 6px", fontSize: 11, color: "#555",
                        width: "100%", display: "block",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        cursor: "default",
                    }}>
                        {row.ITEMNAME || value || ""}
                    </span>
                );
            }

            // ── Non-tagged row: normal combobox ───────────────────────────────
            // if (!isEditing && !isFocused && tranEditing) {
            //     const item = items.find((i) => i.value === value?.toString());
            //     return (
            //         <span style={{ padding: "0 6px", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
            //             {row.ITEMNAME  || item?.label || value || ""}
            //         </span>
            //     );
            // }
            // Active editable cell — show combobox
            return (
                <SelectCombobox
                    value={value || ""}
                    onChange={(v) => { onChange(v); if (v) onCommit(); }}
                    items={items}
                    placeholder={field.placeholder || `Select ${field.label}`}
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    rounded="sm"
                    disable={false}
                />
            );
        }

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
                noBorder
                disabled={col.disabled || shouldDisableOnEditing && tranEditing}
                allowFocus
            />
        );
    }, [formFields, isIssue, handleOpenStoneModal, handleOpenMiscModal ,tranEditing]);
    // Note: activeRowId intentionally NOT in renderCell deps — STNWT uses per-row data

    // ── Colors ────────────────────────────────────────────────────────────────
    const TYPE_COLORS: Record<string, string> = { PU: "#b7fff1", PR: "#ffc4c4", ISP: "#ffd9a4", REC: "#ffcafb" };
    const accentColor = { PU: "#2F855A", PR: "#C53030", ISP: "#DD6B20", REC: "#c729ba" }[transactionType ?? ""] ?? "#185FA5";
    const showTag = getIsTagEnabled(transactionType);

    useGlobalKey("Escape", () => {
        setIsMiscModalOpen(false);
        setLastClosedModal("hmc");
        setModalTrigger((t) => t + 1);
    }, "close-modal");

    const committedRows = draftRows.filter((r) => !!(r.ITEMID || r.PUREID || r.WT || r.GRSWT));

    const focusColAfterModal = useMemo(() => {
        if (lastClosedModal === "stoneMaster") return "TOUCH";
        if (lastClosedModal === "hmc") return "MC";
        return isIssue ? "PUREID" : "ITEMID";
    }, [lastClosedModal, isIssue]);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <Box display="flex" flexDirection="column" gap={0}>
            <Flex
                justifyContent="space-between" alignItems="center"
                px={2} py={1} bg="#FFF" color="#222" rounded="md"
                borderWidth="1px" borderColor={theme?.colors?.borderColor || "#CBD5E0"}
            >
                <HStack gap={2}>
                    <Text fontSize="xs" fontWeight="semibold" color={theme?.colors?.primaryText || "#1a202c"}>
                        {transactionTitle || "Transaction"}
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
                {transactionType === "PU" && 
                    <Badge
                        colorPalette={"red"}
                        variant="subtle"
                        fontSize="2xs"
                        px={2}
                        onClick={() => router.push("/dashboard/Master/Item/ItemMaster/")}
                    >
                        Add Item  Name
                    </Badge>
                }
                {transactionType === "REC" && 

                    <Badge
                        colorPalette={"gray"}
                        variant="subtle"
                        fontSize="2xs"
                        px={2}
                        onClick={() => router.push("/dashboard/Master/Item/pureGold/")}
                    >
                        Add Pure Gold Name
                    </Badge>
                 }
               
                {!isEditing && (
                    <>
                        
                    <Button
                        size="2xs" colorPalette="red" variant="outline" fontSize="2xs"
                        onClick={() => {
                            onClear?.();
                            setDraftRows([makeEmptyRow(formFields, !!isIssue)]);
                            setActiveRowId(null);
                        }}
                    >
                        <Icon as={LuX} boxSize={2} /> Clear All
                    </Button>
                    </>
                )}
            </Flex>

            <Box
                bg={TYPE_COLORS[transactionType ?? ""] || "#FFF"}
                borderWidth="1px" borderColor={theme?.colors?.borderColor || "#CBD5E0"}
                borderRadius="md" overflow="hidden"
            >
                <ExcelGrid
                    columns={gridColumns}
                    rows={draftRows}
                    renderCell={renderCell}
                    onCellChange={handleCellChange}
                    onRowAdd={handleAddRow}
                    onRowDelete={handleDeleteRow}
                    onActiveChange={handleActiveChange}
                    errors={errors}
                    touched={touched}
                    showTotals={committedRows.length > 0}
                    showAddRow
                    showDeleteRow
                    maxVisibleRows={4}
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
                    initialFocusCell={{ rowIndex: 0, colKey: isIssue ? "PUREID" : "ITEMID" }}
                    focusAfterModal={{
                        cell: { rowIndex: activeRowIndex >= 0 ? activeRowIndex : 0, colKey: focusColAfterModal },
                        trigger: modalTrigger,
                    }}
                    showEnterNavigate={false}
                    tranEditing = {isEditing}
                    isModifying = {isModifying}
                />
            </Box>

            {/* ── Stone modal ──────────────────────────────────────────────── */}
            {isStoneModalOpen && stoneModalRowId && (
                <Box
                    position="fixed" top={0} left={0} right={0} bottom={0}
                    bg="rgba(0,0,0,0.5)" zIndex={100}
                    display="flex" alignItems="center" justifyContent="center"
                    onClick={() => { setLastClosedModal("stoneMaster"); setModalTrigger((t) => t + 1); setIsStoneModalOpen(false); }}
                >
                    <Box
                        bg={theme?.colors?.formColor || "white"} borderRadius="lg"
                        maxW="1000px" width="100%" maxH="90vh" overflow="auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <StoneEnterMaster
                            grsWeight={currentGRSWT}
                            onClose={() => { setLastClosedModal("stoneMaster"); setModalTrigger((t) => t + 1); setIsStoneModalOpen(false); }}
                            draftRowId={stoneModalRowId}
                            initialRows={stoneModalInitialRows}
                            onSave={(stoneRows) => {
                                const updatedStones = stoneRows.map((s) => ({ ...s, draftRowId: stoneModalRowId }));
                                const stoneWtTotal = updatedStones.reduce((sum, r) => {
                                    const wt = Number(r.stoneWeight || 0);
                                    return sum + (r.stoneUnit === "c" ? wt / 5 : wt);
                                }, 0);
                                const stnAmtTotal = updatedStones.reduce((sum, r) => sum + r.stoneAmount, 0);
                                const capturedRowId = stoneModalRowId;

                                setDraftRows((prev) =>
                                    prev.map((r) => {
                                        if (r.__rowId !== capturedRowId) return r;
                                        return recalcRow(
                                            { ...r, _stones: updatedStones, STNWT: stoneWtTotal.toFixed(3), STNAMT: stnAmtTotal.toFixed(2) },
                                            !!isIssue
                                        );
                                    })
                                );

                                if (committedRowIdsRef.current.has(capturedRowId)) {
                                    pendingStoreCallRef.current = () => commitRowUpdate(capturedRowId, {
                                        _stones: updatedStones,
                                        STNWT: stoneWtTotal.toFixed(3),
                                        STNAMT: stnAmtTotal.toFixed(2),
                                    });
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
                    onClick={() => { setLastClosedModal("hmc"); setModalTrigger((t) => t + 1); setIsMiscModalOpen(false); }}
                >
                    <Box
                        bg={theme?.colors?.formColor || "white"} borderRadius="lg"
                        maxW="700px" width="100%" maxH="90vh" overflow="auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <OtherChargesWindow
                            key={`${miscModalRowId}-${otherChargesInitialRows.length}`}
                            draftRowId={miscModalRowId}
                            onClose={() => { setLastClosedModal("hmc"); setModalTrigger((t) => t + 1); setIsMiscModalOpen(false); }}
                            initialRows={otherChargesInitialRows}
                            onSave={(chargeRows) => {

                                const capturedRowId = miscModalRowId;

                                setDraftRows((prev) =>
                                    prev.map((r) => {

                                        if (r.__rowId !== capturedRowId) return r;

                                        const pcs = Number(r.PCS || 0);

                                        const updatedCharges = chargeRows.map((c) => ({
                                            ...c,
                                            draftRowId: capturedRowId,

                                            finalAmount: calculateMiscChargeFinalAmount({
                                                chargeName :c.chargeName,
                                                amount :Number(c.amount || 0),
                                                pcs:pcs,
                                                isHmcFinalAmt: usePcsBySoftControl
                                            }),
                                        }));
                                        console.log(updatedCharges,'updatedCharges');

                                        const total = updatedCharges.reduce(
                                            (sum, c) => sum + (Number(c.finalAmount) || 0),
                                            0
                                        );

                                        return {
                                            ...r,
                                            _miscCharges: updatedCharges,
                                            HMC: total.toFixed(2),
                                        };
                                    })
                                );

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