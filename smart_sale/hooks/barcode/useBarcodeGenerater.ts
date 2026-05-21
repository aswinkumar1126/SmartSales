"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toaster } from "@/components/ui/toaster";

/* ── Store ── */
import {
  useBarcodeStore,
  useSavedRows,
  useNewRows,
  type BarcodeTransactionRow,
} from "@/store/barcode/useBarcodeStore";

/* ── Logic hooks ── */
import { useTaggingValidation } from "./useTaggingValidation";
import { useStockLimits } from "./useStockLimits";
import { usePrintHandler } from "./usePrintHandler";
import { useBarcodeNumbering } from "./useBarcodeNumbering";

/* ── API hooks ── */
import { useAllAccountHead } from "@/hooks/apiHooks/accountHead/useAccountHead";
import { useBarcodeItems, useCreateTag, useUpdateTag } from "@/hooks/apiHooks/barcode/useBarcodeItems";
import { useActivePrinter } from "@/hooks/apiHooks/print/usePrint";
import { useTagEntryNos, useTagedDetailsByEntryNo } from "@/hooks/apiHooks/tag/useTag";
// import { useSize } from "@/hooks/apiHooks/size/useSize";
import { useSoftControlById } from "../apiHooks/softControl/useSoftControl";

/* ── Utils ── */
import { formatToFixed } from "@/utils/format/numberFormat";
import { transactionTableCols } from "@/data/barcodeGenerate/barcodeFormFields";

import { CellChange, ChangeSource } from "handsontable/common";
import { ExcelData } from "@/app/dashboard/Transaction/BarCodeGenerate/excel/BarCodeExcel";

import { useGlobalKey } from "@/components/key/useGlobalKey";

/* ============================================================
   CONSTANTS
   ============================================================ */

export const FIELD_ORDER = [
  "barcode", "grsweight", "purchaseStoneWt", "stoneWt", "navaWt", "diamondWt", "size",
  // "wastePercent","mc", "touch",
] as const;

export const FIELD_ORDER_NOT_STONE = [
  "barcode", "grsweight", "diamondWt", "size",
] as const;

export type FieldKey = (typeof FIELD_ORDER)[number];
export type FieldKeyNotStone = (typeof FIELD_ORDER_NOT_STONE)[number];

type ActiveFieldKey = FieldKey | FieldKeyNotStone;

const NUMERIC_FIELDS = new Set([
  "grsweight", "purchaseStoneWt", "stoneWt", "navaWt", "salesStoneWt", "diamondWt",
  // "wastePercent", "mc", "touch",
]);
const REQUIRED_FIELDS_STN = new Set(["grsweight", "purchaseStoneWt", "salesStoneWt"]);
const REQUIRED_FIELDS = new Set(["grsweight"]);

const EMPTY_TRANSACTION_FORM = {
  barcode: "", grsweight: "", purchaseStoneWt: "", stoneWt: "", navaWt: "", salesStoneWt: "", diamondWt: "", size: "",
  // wastePercent: "", mc: "", touch: "",
};

const EMPTY_ARRAY: never[] = [];
const safeNum = (v: unknown) => { const n = Number(v); return isNaN(n) ? 0 : n; };

/* ============================================================
   HOOK
   ============================================================ */

export function useBarcodeGenerate() {

  /* ── Store — flat primitives & actions only ── */
  const headerForm = useBarcodeStore((s) => s.headerForm);
  const rows = useBarcodeStore((s) => s.rows);
  const printDetails = useBarcodeStore((s) => s.printDetails);
  const isEditing = useBarcodeStore((s) => s.isEditing);
  const selectedEntryNo = useBarcodeStore((s) => s.selectedEntryNo);
  const singleSearch = useBarcodeStore((s) => s.singleSearch);
  const tagFilterParams = useBarcodeStore((s) => s.tagFilterParams);

  const setHeaderField = useBarcodeStore((s) => s.setHeaderField);
  const setHeaderForm = useBarcodeStore((s) => s.setHeaderForm);
  const addRow = useBarcodeStore((s) => s.addRow);
  const updateRow = useBarcodeStore((s) => s.updateRow);
  const setRows = useBarcodeStore((s) => s.setRows);
  const loadApiRows = useBarcodeStore((s) => s.loadApiRows);
  const setPrintId = useBarcodeStore((s) => s.setPrintId);
  const setPrintDetails = useBarcodeStore((s) => s.setPrintDetails);
  const setIsEditing = useBarcodeStore((s) => s.setIsEditing);
  const setSelectedEntryNo = useBarcodeStore((s) => s.setSelectedEntryNo);
  const setSingleSearch = useBarcodeStore((s) => s.setSingleSearch);
  const setTagFilterField = useBarcodeStore((s) => s.setTagFilterField);
  const clearAll = useBarcodeStore((s) => s.clearAll);

  const savedRows = useSavedRows();
  const newRows = useNewRows();

  /* ── Local UI state ── */
  const [transactionForm, setTransactionForm] = useState(EMPTY_TRANSACTION_FORM);
  const [editRowId, setEditRowId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [headerErrors, setHeaderErrors] = useState<Record<string, string>>({});
  const [isSubmittingRow, setIsSubmittingRow] = useState(false);
  const [isSubmittingTag, setIsSubmittingTag] = useState(false);
  const [excelDrawerOpen, setExcelDrawerOpen] = useState(false);
 
  const [deselectFlag, setDeselectFlag] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | undefined>(undefined);
  const [excelData, setExcelData] = useState<ExcelData>([]);
  const [originalRow, setOriginalRow] = useState<BarcodeTransactionRow | null>(null);

  const [savedRowsInEditing ,setSavedRowsInEditing] =useState<number>(1);

  /* ── Refs ── */
  const transactionFormRef = useRef(transactionForm);
  const rowsRef = useRef<BarcodeTransactionRow[]>([]);
  const editingRowIdRef = useRef(editRowId);
  const originalRowRef = useRef(originalRow);



  

  useEffect(() => { rowsRef.current = rows; }, [rows]);
  useEffect(() => { transactionFormRef.current = transactionForm; }, [transactionForm])
  useEffect(() => { editingRowIdRef.current = editRowId; }, [editRowId]);
  useEffect(() => { originalRowRef.current = originalRow; }, [originalRow]);

  const fieldRefs = useRef(
    Object.fromEntries(
      FIELD_ORDER.map((k) => [k, { current: null as HTMLInputElement | null }])
    ) as Record<FieldKey, React.MutableRefObject<HTMLInputElement | null>>
  );

  // const fieldRefsNotStone = useRef(
  //   Object.fromEntries(
  //     FIELD_ORDER_NOT_STONE.map((k) => [k, { current: null as HTMLInputElement | null }])
  //   ) as Record<FieldKey, React.MutableRefObject<HTMLInputElement | null>>
  // );


  /* ── API ── */
  const { data: allPurchaseAccount } = useAllAccountHead("", { accountType: "PR" });
  const { data: allCustomerAccount } = useAllAccountHead("", { accountType: "CR" });
  const {data: allParties } = useAllAccountHead("");
  const { data: printerSettings } = useActivePrinter();
  const printer = useMemo(() => printerSettings?.data ?? null, [printerSettings]);

  const { data: toleranceData } = useSoftControlById("LOT-TOLERANCE");

  const { data: stoneToleranceData } = useSoftControlById("	LOT_STONE_TOLERANCE");

  const tolerance = useMemo(() => {
    return Number(toleranceData?.CTLTEXT ?? 0);
  }, [toleranceData]);


  const stoneTolerance = useMemo(()=>{
    return Number(stoneToleranceData?.CTLTEXT ?? 0);
  }, [stoneToleranceData]);

  console.log(stoneTolerance ,'stoneTolerance');

  const barcodeQueryParams = useMemo(() => ({
    ACCODE: Number(headerForm.COMPANYNAME),
    PURCHASE_ENTRYNO: Number(headerForm.INWARDNO),
    SNO: String(headerForm.ITEMNAME),
    ISEDITING: isEditing,
    ENTRYNO: isEditing ? Number(selectedEntryNo) : undefined,
    RETAG: headerForm.RETAG,
  }), [headerForm.COMPANYNAME, headerForm.INWARDNO, headerForm.ITEMNAME, isEditing, selectedEntryNo ,headerForm.RETAG ]);

  const { data: barcodeItems } = useBarcodeItems(barcodeQueryParams);
  

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!isEditing) {
      if (isFirstRender.current) { isFirstRender.current = false; return; }
      if (barcodeItems?.ENTRY_NO) {
        setHeaderField("ENTRYNO", String(barcodeItems.ENTRY_NO));
      }
    }
  }, [barcodeItems?.ENTRY_NO, setHeaderField, isEditing]);

  /* ── Tag listing ── */
  const filteredTagParams = useMemo(() => {
    const out: Record<string, string> = {};
    Object.entries(tagFilterParams).forEach(([k, v]) => {
      if (typeof v === "string" && v.trim()) out[k] = v.trim();
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(tagFilterParams)]);

  const { data: tagEntryNos, refetch: refetchTagList } = useTagEntryNos(filteredTagParams);

  const tagFilterParamsKey = JSON.stringify(tagFilterParams);
  useEffect(() => {
    refetchTagList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagFilterParamsKey]);

  const { data: tagDetails } = useTagedDetailsByEntryNo(selectedEntryNo);

  /* ── Collections ── */
  const purchaserCollection = useMemo(() =>
    Array.isArray(allPurchaseAccount?.data?.acheads)
      ? allPurchaseAccount.data.acheads.map((i: any) => ({ label: i.ACNAME, value: String(i.ACCODE) }))
      : EMPTY_ARRAY,
    [allPurchaseAccount?.data?.acheads]);


  const customerCollection = useMemo(() =>
    Array.isArray(allCustomerAccount?.data?.acheads)
      ? allCustomerAccount.data.acheads.map((i: any) => ({ label: i.ACNAME, value: String(i.ACCODE) }))
      : EMPTY_ARRAY,
    [allCustomerAccount?.data?.acheads]);

  /* ── Collections ── */
  const allPartiesCollections = useMemo(() =>
    Array.isArray(allParties?.data?.acheads)
      ? allParties.data.acheads.map((i: any) => ({ label: i.ACNAME, value: String(i.ACCODE) }))
      : EMPTY_ARRAY,
    [allParties?.data?.acheads]);

  
  const inwardCollection = useMemo(() =>
    Array.isArray(barcodeItems?.PURCHASE_ENTRY_NO)
      ? barcodeItems.PURCHASE_ENTRY_NO.map((i: number) => ({ label: `INWARD NO ${i}`, value: String(i) }))
      : EMPTY_ARRAY,
    [barcodeItems?.PURCHASE_ENTRY_NO]);

  const itemCollection = useMemo(() =>
    Array.isArray(barcodeItems?.ITEMLIST)
      ? barcodeItems.ITEMLIST.map((i: any) => ({ label: i.ITEMNAME, value: i.SNO, itemId: i.ITEMID }))
      : EMPTY_ARRAY,
    [barcodeItems?.ITEMLIST]);

  const itemSizeCollection = useMemo(() =>
    Array.isArray(barcodeItems?.SIZELIST)
      ? barcodeItems.SIZELIST.map((i: any) => ({ label: i.SIZENAME, value: String(i.SIZEID) }))
      : EMPTY_ARRAY,
    [barcodeItems?.SIZELIST]);

  const baseBarcodePrefix = barcodeItems?.TAGNO?.PREFIX ?? "";
  const startBarcodeNumber = Number(barcodeItems?.TAGNO?.TAGNO ?? 0);

  const itemId = useMemo(
    () => itemCollection.find((i: any) => i.value === headerForm.ITEMNAME)?.itemId ?? null,
    [headerForm.ITEMNAME, itemCollection]);

  const selectedItem = barcodeItems?.SELECTED_ITEM ?? null;
  const hasStone = selectedItem?.STNPRESENT === "Y";

  const stockTableData = useMemo(() =>
    Array.isArray(selectedItem) ? selectedItem
      : selectedItem ? [selectedItem]
        : EMPTY_ARRAY,
    [selectedItem]);

  useEffect(() => {
    if (selectedItem?.ITEMID) setSelectedItemId(selectedItem.ITEMID);
  }, [selectedItem]);

  /* ── Logic hooks ── */
  const { validateHeaderWithToast, validateSingleRow, validateRows } = useTaggingValidation();

  const { summary: stockSummary, limits, remaining } = useStockLimits(selectedItem, rows);

  const remainingRef = useRef(remaining);
  const limitsRef = useRef(limits);

  useEffect(() => { limitsRef.current = limits; }, [limits])

  useEffect(() => { remainingRef.current = remaining; }, [remaining])

  const { printAll, printSingle, downloadSetupFiles } = usePrintHandler();

  const { assignBarcodes, assignSingleBarcode } = useBarcodeNumbering({
    prefix: baseBarcodePrefix,
    startNumber: startBarcodeNumber,
    isEditing,
  });

  const assignSingleBarcodeRef = useRef(assignSingleBarcode);

  useEffect(() => {
    assignSingleBarcodeRef.current = assignSingleBarcode;
  }, [assignSingleBarcode]);

  /* ── EXCEL IMPORT DATA ── */
  const handleExcelChange = useCallback(
    (changes: CellChange[] | null, _source: ChangeSource) => {
      if (!changes) return;
      setExcelData((prev) => {
        const next = prev.map((row) => [...row]);
        changes.forEach(([row, col, , newVal]) => {
          while (next.length <= row) next.push([]);
          next[row][col as number] = newVal as string | number | null;
        });
        return next;
      });
    },
    []
  );

  const populateExcelFromRows = useCallback(() => {
    if (!rows.length) return;

    const excelRows: ExcelData = rows.map((row) => [
      row.grsweight,
      row.purchaseStoneWt,
      row.stoneWt,
      row.navaWt,
      row.salesStoneWt,
      row.diamondWt,
      row.size,

      // hidden columns
      row.id ?? null,
      row.barcode ?? null,
      row.isTaged ?? false,
    ]);

    setExcelData(excelRows);
    setExcelDrawerOpen(true);

  }, [rows]);

  /* ── Mutations ── */
  const { mutate: createTag } = useCreateTag();
  const { mutate: updateTag } = useUpdateTag();

  /* ── Focus helper ── */
  const focusField = useCallback((key: FieldKey) => {
    setTimeout(() => {
      fieldRefs.current[key]?.current?.focus?.();
      fieldRefs.current[key]?.current?.select?.();
    }, 50);
  }, []);

  /* ── Header / form handlers ── */
  const handleHeaderChange = useCallback((field: string, value: any) => {
    setHeaderField(field as keyof typeof headerForm, value);
    setHeaderErrors({});
  }, [setHeaderField]);

  const handleFormChange = useCallback((key: string, value: unknown) => {
    setTransactionForm((p) => {
      const updated = { ...p, [key]: value };
      // Auto-calculate salesStoneWt = stoneWt + navaWt
      if (key === "stoneWt" || key === "navaWt") {
        const stoneWt = key === "stoneWt" ? Number(value) : Number(updated.stoneWt);
        const nava = key === "navaWt" ? Number(value) : Number(updated.navaWt);
        updated.salesStoneWt = String((stoneWt + nava).toFixed(3));
      }
      return updated;
    });
    setTouched((p) => ({ ...p, [key]: true }));
    setFieldErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  }, []);

  const resetForm = useCallback(() => {
    setTransactionForm(EMPTY_TRANSACTION_FORM);
    setFieldErrors({});
    setTouched({});
    setEditRowId(null);
  }, []);

  /* ── Row submit ── */
  const handleRowSubmit = useCallback(() => {
    const currentForm = transactionFormRef.current;
    const editingRowId = editingRowIdRef.current;
    const remainingByRef = remainingRef.current;
    const originalRow = originalRowRef.current;

    const editingRow = rowsRef.current.find(r => r.id === editingRowId);

    let effectiveBalance = { ...remainingByRef };

    if (editingRowId && originalRow) {
      effectiveBalance = {
        PCS: effectiveBalance.PCS + 1,
        GRSWT: effectiveBalance.GRSWT + Number(originalRow.grsweight || 0),
        STNWT: effectiveBalance.STNWT + Number(originalRow.purchaseStoneWt || 0),
      };
    }

    const errors = validateSingleRow(

      {
        rowId: editingRowId,
        grsweight: currentForm.grsweight,
        purchaseStoneWt: currentForm.purchaseStoneWt,
        salesStoneWt: currentForm.salesStoneWt
      },
      hasStone,
      effectiveBalance,
      limits,
      rows,
      tolerance
    );

    console.log(errors, 'row errors');

    if (Object.keys(errors).length) {
      setTouched(FIELD_ORDER.reduce((a, k) => ({ ...a, [k]: true }), {} as Record<string, boolean>));
      setFieldErrors(errors);
      const first = FIELD_ORDER.find((k) => errors[k]);
      if (first) {
        focusField(first);
        toaster.create({ title: "Validation Error", description: errors[first], type: "error", duration: 2000 });
      }
      return;
    }

    setIsSubmittingRow(true);

    try {
      const formValues = {
        grsweight: Number(currentForm.grsweight),
        purchaseStoneWt: Number(currentForm.purchaseStoneWt),
        stoneWt: Number(currentForm.stoneWt),
        navaWt: Number(currentForm.navaWt),
        salesStoneWt: Number(currentForm.salesStoneWt),
        diamondWt: Number(currentForm.diamondWt),
        // wastePercent: Number(currentForm.wastePercent || 0),
        size: currentForm.size,
        // mc: Number(currentForm.mc),
        // touch: Number(currentForm.touch),
      };

      if (editingRowId) {
        updateRow(editingRowId, formValues);
        toaster.create({ title: "Row Updated", type: "success", duration: 2000 });
        setEditRowId(null);
        setOriginalRow(null);
      } else {
        const barcode = assignSingleBarcodeRef.current(rowsRef.current.length ,isEditing);

        if (!barcode) {
          toaster.create({
            title: "Barcode not ready",
            description: "Please wait for initialization",
            type: "warning",
            duration: 2000,
          });
          return;
        }

        addRow({
          ...formValues,
          barcode,
          draftRowId: headerForm.ENTRYNO || String(Date.now()),
        });

        toaster.create({
          title: "Row Added",
          type: "success",
          duration: 2000,
        });
      }
      resetForm();
      setTimeout(() => focusField(FIELD_ORDER[1]), 50);
    } finally {
      setIsSubmittingRow(false);
    }
  }, [
    hasStone,
    validateSingleRow,
    assignSingleBarcode,
    addRow,
    updateRow,
    resetForm,
    focusField,
    headerForm.ENTRYNO,
    tolerance,
    rows
  ]);

  const moveToNext = useCallback(
    (currentKey: ActiveFieldKey) => {
      const activeFieldOrder = hasStone
        ? FIELD_ORDER
        : FIELD_ORDER_NOT_STONE;

      const idx = activeFieldOrder.indexOf(currentKey as never);

      if (idx !== -1 && idx < activeFieldOrder.length - 1) {
        focusField(activeFieldOrder[idx + 1]);
      } else {
        handleRowSubmit();
      }
    },
    [focusField, hasStone ,handleRowSubmit]
  );
 

  const handleEditRow = useCallback((row: BarcodeTransactionRow) => {
    setTransactionForm({
      barcode: row.barcode,
      grsweight: row.grsweight.toString(),
      purchaseStoneWt: row.purchaseStoneWt.toString(),
      stoneWt: row.stoneWt.toString(),
      navaWt: row.navaWt.toString(),
      salesStoneWt: row.salesStoneWt.toString(),
      // wastePercent: row.wastePercent.toString(),
      size: row.size,
      diamondWt: row.diamondWt.toString(),
      // mc: row.mc.toString(),
      // touch: row.touch.toString(),
      // isTaged : row.isTaged ,
    });
    setOriginalRow(row);
    setEditRowId(row.id);
    setFieldErrors({});
    setTouched({});
    setTimeout(() => focusField(FIELD_ORDER[1]), 50);
  }, [focusField]);

  const handleDeleteRow = useCallback((row: BarcodeTransactionRow) => {
    if (!window.confirm("Delete this item?")) return;
    const remaining = rowsRef.current.filter((r) => r.id !== row.id);
    setRows(assignBarcodes(remaining));
    if (editRowId === row.id) resetForm();
    toaster.create({ title: "Row Deleted", type: "info", duration: 1000 });
  }, [editRowId, assignBarcodes, setRows, resetForm]);



  // Update handleExcelLoad to accept ExcelRowData[]
  const handleExcelLoad = useCallback((parsedRows: any[]) => {

    const remainingByRef = remainingRef.current;
    let effectiveBalance = { ...remainingByRef };


    if (!parsedRows.length) return;
    if (!validateHeaderWithToast(headerForm)) return;
    if (!validateRows({ rows, limits, countOnlyNew: isEditing, incomingRows: parsedRows, balance: effectiveBalance, tolerance: tolerance,stnTolerance :stoneTolerance })) return;

    const draftRowId = headerForm.ENTRYNO || String(Date.now());
    const merged = [
      ...rowsRef.current,
      ...parsedRows.map((r) => ({
        id: `excel-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        draftRowId,
        grsweight: r.grsweight || 0,
        purchaseStoneWt: r.purchaseStoneWt || 0,
        stoneWt: r.stoneWt || 0,
        navaWt: r.navaWt || 0,
        salesStoneWt: r.salesStoneWt || 0,
        // wastePercent: r.wastePercent || 0,
        size: r.size || "",
        diamondWt: r.diamondWt || 0,
        // mc: r.mc || 0,
        // touch: r.touch || 0,
        barcode: "",
        isNew: true as const,
      })),
    ];
    setRows(assignBarcodes(merged));

    toaster.create({ title: "Excel Imported", description: `${parsedRows.length} row(s) added`, type: "success", duration: 2500 });
    setExcelData([]);
    setExcelDrawerOpen(false);
  }, [headerForm, rows, limits, isEditing, validateHeaderWithToast, validateRows, assignBarcodes, setRows, tolerance]);


  // Replace handleExcelUpdate with this corrected version:
  const handleExcelUpdate = useCallback((parsedRows: any[]) => {

    if (!parsedRows.length) return;

    console.log(parsedRows, "parsedRows");

    if (!validateHeaderWithToast(headerForm)) return;

    const remainingByRef = remainingRef.current;
    let effectiveBalance = { ...remainingByRef };

    if (
      !validateRows({
        rows,
        limits,
        countOnlyNew: false,
        incomingRows: parsedRows,
        tolerance,
        balance: effectiveBalance,
        isUpdate: true,
      })
    ) {
      return;
    }

    const currentRows = rowsRef.current;

    /**
     * ==========================================
     * GET CURRENT MAX BARCODE NUMBER
     * ==========================================
     */

    const usedBarcodeNumbers = currentRows
      .map((r) => {

        const match = String(r.barcode || "")
          .match(/\d+$/);

        return match
          ? Number(match[0])
          : 0;

      })
      .filter((n) => !isNaN(n));

    /**
     * NEXT AVAILABLE NUMBER
     */
    let nextBarcodeNumber =
      usedBarcodeNumbers.length > 0
        ? Math.max(...usedBarcodeNumbers) + 1
        : startBarcodeNumber + 1;

    /**
     * ==========================================
     * BUILD UPDATED ROWS
     * ==========================================
     */

    const updatedRows = parsedRows.map((r) => {

      /**
       * MATCH ONLY BY UNIQUE ROW ID
       */
      const existingRow = currentRows.find(
        (row) => row.id === r.id
      );

      const isExisting = !!existingRow;

      /**
       * ==========================================
       * KEEP EXISTING BARCODE
       * ==========================================
       */

      let barcode =
        r.barcode ||
        existingRow?.barcode ||
        "";

      /**
       * ==========================================
       * GENERATE ONLY FOR BRAND NEW ROWS
       * ==========================================
       */

      if (!barcode) {

        barcode = `${baseBarcodePrefix}${nextBarcodeNumber}`;

        nextBarcodeNumber++;
      }

      return {

        /**
         * ==========================================
         * KEEP EXISTING ID
         * ==========================================
         */

        id:
          r.id ||
          existingRow?.id ||
          `excel-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 7)}`,

        /**
         * ==========================================
         * KEEP EXISTING draftRowId
         * ==========================================
         */

        draftRowId:
          r.draftRowId ||
          existingRow?.draftRowId ||
          headerForm.ENTRYNO ||
          String(Date.now()),

        /**
         * ==========================================
         * ROW VALUES
         * ==========================================
         */

        grsweight: r.grsweight || 0,
        purchaseStoneWt: r.purchaseStoneWt || 0,
        stoneWt: r.stoneWt || 0,
        navaWt: r.navaWt || 0,
        salesStoneWt: r.salesStoneWt || 0,
        diamondWt: r.diamondWt || 0,
        size: r.size || "",

        /**
         * ==========================================
         * FINAL BARCODE
         * ==========================================
         */

        barcode,

        /**
         * ==========================================
         * EXISTING / NEW
         * ==========================================
         */

        isNew: !isExisting,

        /**
         * ==========================================
         * KEEP TAG STATUS
         * ==========================================
         */

        isTaged:
          r.isTaged ??
          existingRow?.isTaged ??
          false,
      };
    });

    console.log(updatedRows, "updatedRows");

    /**
     * ==========================================
     * SAVE
     * ==========================================
     */

    setRows(updatedRows);

    toaster.create({
      title: "Excel Updated",
      description: `${updatedRows.length} row(s) updated`,
      type: "success",
      duration: 2500,
    });

    setExcelData([]);
    setExcelDrawerOpen(false);

  }, [
    headerForm,
    rows,
    limits,
    validateHeaderWithToast,
    validateRows,
    setRows,
    tolerance,
    isEditing,
    savedRowsInEditing,
    baseBarcodePrefix,
    startBarcodeNumber,
  ]);


  const hasExistingRows = rows.length > 0;


  /* ── Save / Update ── */
  const buildPayload = useCallback(() => {
    const purchaseDetails = {
      TOTALPCS: rows.length,
      ENTRYNO: Number(headerForm.ENTRYNO),
      PUENTRYNO: Number(headerForm.INWARDNO),
      ITEMID: itemId,
      ACCODE: Number(headerForm.COMPANYNAME),
      PUSNO: headerForm.ITEMNAME,
      TAGDATE: headerForm.DATE || new Date().toISOString().split("T")[0],
      RETAG: headerForm.RETAG,
    };

    const taggingDetails = rows.map((r) => ({
      TAGNO: r.barcode,
      GRSWT: r.grsweight,
      PURCHASESTNWT: r.purchaseStoneWt,
      STNWT: r.stoneWt,
      NAVAWT: r.navaWt,
      SALESSTNWT: r.salesStoneWt,
      DIAWT: r.diamondWt,
      SIZE: r.size,
      // WASPER: r.wastePercent,
      // MC: r.mc,
      // TOUCH: r.touch,
      // NETWT: r.grsweight - r.stoneWt,
    }));
    return { purchaseDetails, taggingDetails };
  }, [rows, headerForm, itemId]);

  const handleSave = useCallback(() => {
    const remainingByRef = remainingRef.current;
    let effectiveBalance = { ...remainingByRef };

    if (!validateHeaderWithToast(headerForm)) return;
    if (!validateRows({ rows, limits, balance: effectiveBalance, tolerance })) return;
    const { purchaseDetails, taggingDetails } = buildPayload();
    setIsSubmittingTag(true);
    console.log(purchaseDetails,taggingDetails ,'createTag');

    createTag(
      { RETAG :purchaseDetails.RETAG ,  PURCHASEDETAILS: purchaseDetails, TAGGINGDETAILS: taggingDetails },
    
      {
        onSuccess: (res) => {
          toaster.create({ title: "Saved", description: "Tagging created successfully", type: "success", duration: 2000 });
          setPrintId(res?.data?.ENTRYNO);
          setPrintDetails(res?.data?.TAGDETAILS ?? []);
          setTimeout(() => printAll(res?.data?.TAGDETAILS ?? []), 500);
          handleClear();
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || err?.message || "Something went wrong";
          toaster.create({ title: "Error", description: msg, type: "error", duration: 2000 });
        },
        onSettled: () => setIsSubmittingTag(false),
      }
    );
  }, [headerForm, rows, limits, validateHeaderWithToast, validateRows, buildPayload, createTag, setPrintId, setPrintDetails, clearAll, printAll, tolerance]);

  const handleUpdate = useCallback(() => {
    const remainingByRef = remainingRef.current;
    let effectiveBalance = { ...remainingByRef };

    if (!validateHeaderWithToast(headerForm)) return;
    if (!validateRows({ rows, limits, balance: effectiveBalance, countOnlyNew: false, tolerance })) return;
    const { purchaseDetails, taggingDetails } = buildPayload();
    setIsSubmittingTag(true);
    console.log("update tag", purchaseDetails, taggingDetails)

    updateTag(
      { RETAG: purchaseDetails.RETAG, PURCHASEDETAILS: purchaseDetails, TAGGINGDETAILS: taggingDetails, id: Number(headerForm.ENTRYNO) },
      {
        onSuccess: (res) => {
          toaster.create({ title: "Updated", description: "Tagging updated successfully", type: "success", duration: 2000 });
          setPrintId(res?.data?.ENTRYNO);
          setPrintDetails(res?.data?.TAGDETAILS ?? []);
          setTimeout(() => printAll(res?.data?.TAGDETAILS ?? []), 500);
          handleClear();
        },
        onError: (err: any) => {
          toaster.create({ title: "Error", description: err?.message || "Update failed", type: "error", duration: 2000 });
        },
        onSettled: () => setIsSubmittingTag(false),
      }
    );
  }, [headerForm, rows, limits, validateHeaderWithToast, validateRows, buildPayload, updateTag, setPrintId, setPrintDetails, clearAll, printAll, tolerance]);

  /* ── Load existing tag for edit ── */
  useEffect(() => {
    if (!tagDetails) return;
    const purchase = tagDetails.PURCHASEDETAILS;
    const apiRows = tagDetails.TAGGINGDETAILS || [];

    console.log(apiRows,'apiRows')

    setHeaderForm({
      ENTRYNO: String(purchase.ENTRYNO ?? ""),
      COMPANYNAME: String(purchase.ACCODE ?? ""),
      INWARDNO: String(purchase.PUENTRYNO ?? ""),
      ITEMNAME: String(purchase.PUSNO ?? ""),
      DATE: purchase.TAGDATE ?? "",
      RETAG: false,
    });

    loadApiRows(
      apiRows.map((r: any) => ({
        id: `edit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        draftRowId: String(purchase.ENTRYNO),
        grsweight: Number(r.GRSWT) || 0,
        purchaseStoneWt: Number(r.PURCHASESTNWT) || 0,
        stoneWt: Number(r.STNWT) || 0,
        navaWt: Number(r.NAVAWT) || 0,
        salesStoneWt: Number(r.SALESSTNWT) || 0,
        // wastePercent: Number(r.WASPER) || 0,
        size: String(r.SIZE || r.SIZEID || ""),
        diamondWt: Number(r.DIAWT) || 0,
        // mc: Number(r.MC) || 0,
        // touch: Number(r.TOUCH) || 0,
        barcode: r.TAGNO || "",
        isTaged : true,
      }))
    );
    setIsEditing(true);
    setPrintDetails(apiRows);
  }, [tagDetails]);


  

  /* ── Tag selection ── */
  const handleSelectTag = useCallback((entryNo: string) => {
    if (rowsRef.current.length > 0 && !isEditing) {
      toaster.create({
        title: 'Clear Tags Or Save Tags',
        type: 'info',
        description: 'Please clear the current tag before selecting a new one.',
      });
    } else {
      if (selectedEntryNo === entryNo) {
        setSelectedEntryNo("");
        setTimeout(() => setSelectedEntryNo(entryNo), 10);
      } else {
        setSelectedEntryNo(entryNo);
      }
    }
  }, [selectedEntryNo, setSelectedEntryNo, isEditing]);

  /* ── Clear ── */
  const handleClear = useCallback(() => {
    clearAll();
    resetForm();
    setDeselectFlag(true);
    setTimeout(() => setDeselectFlag(false), 50);

    if (barcodeItems?.ENTRY_NO) {
      setHeaderField("ENTRYNO", String(barcodeItems.ENTRY_NO));
    }
  }, [clearAll, barcodeItems]);


  /*--------------SAVE TRANSACTION ----------------------*/
  useGlobalKey("ALT+S", () => { isEditing ? handleUpdate() : handleSave() });
  useGlobalKey("ALT+C", handleClear);


  /* ── Table config ── */
  // Update transactionFormFields to filter based on hasStone
  const transactionFormFields = useMemo(() =>
    transactionTableCols
      .filter((col) => {
        // If column has showWhenHasStone flag, only show when hasStone is true
        if ('showWhenHasStone' in col && col.showWhenHasStone) {
          return hasStone;
        }
        return true;
      })
      .map((col): any => {
        const isNum = NUMERIC_FIELDS.has(col.key);
        const isRequired = hasStone ? REQUIRED_FIELDS_STN.has(col.key) : REQUIRED_FIELDS.has(col.key);
        const base: any = {
          key: col.key,
          label: col.label || col.key,
          placeholder: col.label || col.key,
          type: col.type,
          isRequired,
          size: "xs",
          align: col.type === "number" ? "right" : "left",
          allowFocus: col.allowFocus,
          disabled: col.disabled
        };
        if (col.decimalScale) base.decimalScale = col.decimalScale;
        return base;
      }),
    [hasStone]);

  // Update allDisplayCols to filter stone columns when hasStone is false
  const allDisplayCols = useMemo(() =>
    transactionTableCols
      .filter((col) => {
        // First filter based on hasStone
        if ('showWhenHasStone' in col && col.showWhenHasStone) {
          if (!hasStone) return false;
        }
        // Then filter print column for non-editing mode
        if (!isEditing && col.key === "__print") return false;
        return true;
      })
      .map((col) => ({
        ...col,
        align: col.key === "size" || col.key === "barcode" ? "left" as const
          : col.key === "__print" ? "center" as const : "right" as const,
      })),
    [isEditing, hasStone]);

  const totalPurchaseStoneWt = rows.reduce(
    (s, r) => s + (Number(r.purchaseStoneWt) || 0),
    0
  );

  const totalSalesStoneWt = rows.reduce(
    (s, r) => s + (Number(r.salesStoneWt) || 0),
    0
  );

  const diffStoneWt = totalPurchaseStoneWt -  totalSalesStoneWt ;

  const transactionTotals = useMemo(() => ({
    grsweight: rows.reduce((s, r) => s + r.grsweight, 0),
    purchaseStoneWt: totalPurchaseStoneWt,
    stoneWt: rows.reduce((s, r) => s + r.stoneWt, 0),
    navaWt: rows.reduce((s, r) => s + r.navaWt, 0),
    salesStoneWt: totalSalesStoneWt,
    diamondWt: rows.reduce((s, r) => s + r.diamondWt, 0),
    // mc: rows.reduce((s, r) => s + r.mc, 0),
    // size: totalPurchaseStoneWt - totalSalesStoneWt,

  }), [rows]);

  const showTableForm = useMemo(() => {
    if (editRowId) return true;
    if (isEditing) return false;
    return rows.length < safeNum(selectedItem?.PCS);
  }, [selectedItem?.PCS, rows.length, editRowId, isEditing]);

  const getCellValue = useCallback((col: any, row: BarcodeTransactionRow) => {
    if (col.key === "__print") return null;
    const value = row[col.key as keyof BarcodeTransactionRow];
    if (value === undefined || value === null) return "-";
    if (typeof value === "number") {
      if (["grsweight", "purchaseStoneWt", "stoneWt", "navaWt", "salesStoneWt", "diamondWt"].includes(col.key)) return formatToFixed(value, 3);
      // if (["wastePercent", "mc"].includes(col.key)) return formatToFixed(value, 2);
      // if (col.key === "touch") return formatToFixed(value, 1);
      if (col.key === "size") return formatToFixed(value, 0);
    }
    return value.toString();
  }, []);

  const formatTotal = useCallback((value: unknown, decimalScale?: number, key?: string) => {
    if (value == null || value === "") return "";
    if (key === "PCS") return Math.round(Number(value)).toString();
    return Number(value).toFixed(decimalScale ?? 2);
  }, []);

  /* ── Expose ── */
  return {
    headerForm, rows, savedRows, newRows,
    printDetails, isEditing,
    singleSearch, tagFilterParams,
    transactionForm, editRowId, fieldErrors, touched, headerErrors,
    isSubmittingRow, isSubmittingTag,
    excelDrawerOpen, setExcelDrawerOpen,
  
    deselectFlag,

    excelData,
    setExcelData,
    handleExcelChange,

    purchaserCollection, customerCollection, inwardCollection, itemCollection, itemSizeCollection, allPartiesCollections,
    stockTableData,
    stockSummary, limits, remaining,

    transactionFormFields, allDisplayCols, transactionTotals, showTableForm,
    tagItemList: Array.isArray(tagEntryNos) ? tagEntryNos : EMPTY_ARRAY,
    fieldRefs,
    populateExcelFromRows,
    hasExistingRows,
    diffStoneWt,

    handleHeaderChange, handleFormChange, resetForm,
    handleRowSubmit, moveToNext,
    handleEditRow, handleDeleteRow,
    handleExcelLoad,handleExcelUpdate , handleSave, handleUpdate, handleClear, handleSelectTag,
    setSingleSearch, setTagFilterField,

    handlePrintAll: () => printAll(printDetails),
    handlePrintSingle: (tagNo: string) => {
      const found = printSingle(tagNo, printDetails);
      if (!found) toaster.create({ title: "No print data", description: "Details not found for this tag", type: "error", duration: 2000 });
    },
    handleDownloadSetup: () => {
      if (!printer) { toaster.create({ title: "Printer not configured", type: "error", duration: 2000 }); return; }
      downloadSetupFiles(printer.printerName, printer.exeName);
    },

    getCellValue, formatTotal,
  };
}