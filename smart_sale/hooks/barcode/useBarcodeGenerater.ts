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
import { useSize } from "@/hooks/apiHooks/size/useSize";

/* ── Utils ── */
import { formatToFixed } from "@/utils/format/numberFormat";
import { transactionTableCols } from "@/data/barcodeGenerate/barcodeFormFields";

import { CellChange, ChangeSource } from "handsontable/common";
import { ExcelData } from "@/app/dashboard/Transaction/BarCodeGenerate/excel/BarCodeExcel";

/* ============================================================
   CONSTANTS
   ============================================================ */

export const FIELD_ORDER = [
  "barcode", "grsweight", "stoneWt", "salesStoneWt", "wastePercent",
  "size", "diamondWt", "mc", "touch",
] as const;
export type FieldKey = (typeof FIELD_ORDER)[number];

const NUMERIC_FIELDS = new Set([
  "grsweight", "stoneWt", "salesStoneWt", "wastePercent", "diamondWt", "mc", "touch",
]);
const REQUIRED_FIELDS_STN = new Set(["grsweight", "stoneWt", "salesStoneWt"]);
const REQUIRED_FIELDS = new Set(["grsweight"]);

const EMPTY_TRANSACTION_FORM = {
  barcode: "", grsweight: "", stoneWt: "", salesStoneWt: "", wastePercent: "",
  size: "", diamondWt: "", mc: "", touch: "",
};

const EMPTY_ARRAY: never[] = [];
const safeNum = (v: unknown) => { const n = Number(v); return isNaN(n) ? 0 : n; };

/* ============================================================
   HOOK
   ============================================================ */

export function useBarcodeGenerate() {

  /* ── Store — flat primitives & actions only (no array selectors here) ── */
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
  console.log(originalRow, 'originalRow');


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

  /* ── API ── */
  const { data: allPurchaseAccount } = useAllAccountHead("", { accountType: "PR" });
  const { data: printerSettings } = useActivePrinter();
  const printer = useMemo(() => printerSettings?.data ?? null, [printerSettings]);

  const barcodeQueryParams = useMemo(() => ({
    ACCODE: Number(headerForm.COMPANYNAME),
    PURCHASE_ENTRYNO: Number(headerForm.INWARDNO),
    SNO: String(headerForm.ITEMNAME),
    ISEDITING: isEditing,
    ENTRYNO: isEditing ? Number(selectedEntryNo) : undefined,
  }), [headerForm.COMPANYNAME, headerForm.INWARDNO, headerForm.ITEMNAME, isEditing , selectedEntryNo ]);

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


  const { data: sizes } = useSize("", selectedItemId);

  const itemSizeList = useMemo(() =>
    Array.isArray(sizes)
      ? sizes.map((s: any) => ({ label: s.SIZENAME, value: String(s.SIZEID) }))
      : EMPTY_ARRAY,
    [sizes]);

  /* ── Tag listing ── */

  const filteredTagParams = useMemo(() => {
    const out: Record<string, string> = {};
    Object.entries(tagFilterParams).forEach(([k, v]) => {
      if (typeof v === "string" && v.trim()) out[k] = v.trim();
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(tagFilterParams)]); // stringify → stable primitive dep

  const { data: tagEntryNos, refetch: refetchTagList } = useTagEntryNos(filteredTagParams);
  console.log(tagEntryNos,'tagEntryNos');


  const tagFilterParamsKey = JSON.stringify(tagFilterParams);
  useEffect(() => {
    refetchTagList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagFilterParamsKey]);

  const { data: tagDetails } = useTagedDetailsByEntryNo(selectedEntryNo);

  // console.log(tagDetails,'tagDetails');

  /* ── Collections ── */
  const purchaserCollection = useMemo(() =>
    Array.isArray(allPurchaseAccount?.data?.acheads)
      ? allPurchaseAccount.data.acheads.map((i: any) => ({ label: i.ACNAME, value: String(i.ACCODE) }))
      : EMPTY_ARRAY,
    [allPurchaseAccount?.data?.acheads]);

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

  console.log(barcodeItems, 'barcodeItems');

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

  console.log(remainingRef,'remainingRef');

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


  /*---------EXCEL IMPORT DATA ----------------*/
    const handleExcelChange = useCallback(
      (changes: CellChange[] | null, _source: ChangeSource) => {
        if (!changes) return;
        setExcelData((prev) => {
          const next = prev.map((row) => [...row]);        // shallow-clone each row
          changes.forEach(([row, col, , newVal]) => {
            while (next.length <= row) next.push([]);    // grow if HOT added a spare row
            next[row][col as number] = newVal as string | number | null;
          });
          return next;
        });
      },
      []
    );



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
  const handleHeaderChange = useCallback((field: string, value: unknown) => {
    setHeaderField(field as keyof typeof headerForm, String(value ?? ""));
    setHeaderErrors({});
  }, [setHeaderField]);

  const handleFormChange = useCallback((key: string, value: unknown) => {
    console.log(key,value ,'onchange')
    setTransactionForm((p) => ({ ...p, [key]: value }));
    setTouched((p) => ({ ...p, [key]: true }));
    setFieldErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  }, []);

  const resetForm = useCallback(() => {
    setTransactionForm(EMPTY_TRANSACTION_FORM);
    setFieldErrors({});
    setTouched({});
    setEditRowId(null);
  }, []);

  const moveToNext = useCallback((currentKey: FieldKey) => {
    const idx = FIELD_ORDER.indexOf(currentKey);
    if (idx < FIELD_ORDER.length - 1) focusField(FIELD_ORDER[idx + 1]);
    else handleRowSubmit();
  }, [focusField]); // handleRowSubmit added below via ref pattern


  /* ── Row submit ── */
  const handleRowSubmit = useCallback(() => {

    // Get the current form state from ref
    const currentForm = transactionFormRef.current;
    const editingRowId = editingRowIdRef.current;

    const remainingByRef = remainingRef.current;
    const originalRow = originalRowRef.current;

    console.log(remainingByRef,'remainingByRef');

    const editingRow = rowsRef.current.find(r => r.id === editingRowId);

    let effectiveBalance = { ...remainingByRef };

    if (editingRowId && originalRow) {
      effectiveBalance = {
        PCS: effectiveBalance.PCS + 1,
        GRSWT: effectiveBalance.GRSWT + Number(originalRow.grsweight || 0),
        STNWT: effectiveBalance.STNWT + Number(originalRow.stoneWt || 0),
      };
    }
    console.log(effectiveBalance, 'effectiveBalance');

    // Use currentForm instead of transactionForm for validation
    const errors = validateSingleRow(
      {
        grsweight: currentForm.grsweight,
        stoneWt: currentForm.stoneWt,
        salesStoneWt: currentForm.salesStoneWt
      },
      hasStone,
      effectiveBalance,
    );

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
      // Use currentForm consistently throughout
      const formValues = {
        grsweight: Number(currentForm.grsweight),
        stoneWt: Number(currentForm.stoneWt),
        salesStoneWt: Number(currentForm.salesStoneWt),
        wastePercent: Number(currentForm.wastePercent || 0),
        size: currentForm.size,
        diamondWt: Number(currentForm.diamondWt),
        mc: Number(currentForm.mc),
        touch: Number(currentForm.touch),
      };

      if (editingRowId) {
        updateRow(editingRowId, formValues);
        toaster.create({ title: "Row Updated", type: "success", duration: 2000 });
        setEditRowId(null);
        setOriginalRow(null);
      }

      else {
        const barcode = assignSingleBarcodeRef.current(rowsRef.current.length);

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
    editRowId,
    validateSingleRow,
    assignSingleBarcode,
    addRow,
    updateRow,
    resetForm,
    focusField,
    headerForm.ENTRYNO,

  ]);

  const handleEditRow = useCallback((row: BarcodeTransactionRow) => {

    setTransactionForm({
      barcode: row.barcode,
      grsweight: row.grsweight.toString(),
      stoneWt: row.stoneWt.toString(),
      salesStoneWt: row.salesStoneWt.toString(),
      wastePercent: row.wastePercent.toString(),
      size: row.size,
      diamondWt: row.diamondWt.toString(),
      mc: row.mc.toString(),
      touch: row.touch.toString(),
    });
    setOriginalRow(row); // ✅ store original
    setEditRowId(row.id);
    setFieldErrors({});
    setTouched({});
    setTimeout(() => focusField(FIELD_ORDER[1]), 50);
  }, [focusField]);

  const handleDeleteRow = useCallback((row: BarcodeTransactionRow) => {
    if (!window.confirm("Delete this item?")) return;
    console.log(row, rowsRef.current,'ondelete');
    const remaining = rowsRef.current.filter((r) => r.id !== row.id);
    setRows(assignBarcodes(remaining));
    if (editRowId === row.id) resetForm();
    toaster.create({ title: "Row Deleted", type: "info", duration: 1000 });
  }, [editRowId, assignBarcodes, setRows, resetForm]);

  /* ── Excel load ── */
  const handleExcelLoad = useCallback((parsedRows: any[]) => {
    if (!parsedRows.length) return;
    if (!validateHeaderWithToast(headerForm)) return;
    if (!validateRows({ rows, limits, countOnlyNew: isEditing, incomingRows: parsedRows })) return;

    const draftRowId = headerForm.ENTRYNO || String(Date.now());
    const merged = [
      ...rowsRef.current,
      ...parsedRows.map((r) => ({
        id: `excel-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        draftRowId,
        grsweight: r.grsweight, stoneWt: r.stoneWt, salesStoneWt: r.salesStoneWt,
        wastePercent: r.wastePercent, size: r.size, diamondWt: r.diamondWt,
        mc: r.mc, touch: r.touch, barcode: "", isNew: true as const,
      })),
    ];
    setRows(assignBarcodes(merged));
    
    toaster.create({ title: "Excel Imported", description: `${parsedRows.length} row(s) added`, type: "success", duration: 2500 });
    setExcelData([]);
    setExcelDrawerOpen(false);

  }, [headerForm, rows, limits, isEditing, validateHeaderWithToast, validateRows, assignBarcodes, setRows]);

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
    };
    const taggingDetails = rows.map((r) => ({
      TAGNO: r.barcode, GRSWT: r.grsweight, STNWT: r.stoneWt,
      WASPER: r.wastePercent, DIAWT: r.diamondWt, MC: r.mc,
      TOUCH: r.touch, SALESSTNWT: r.salesStoneWt,
      NETWT: r.grsweight - r.stoneWt, SIZEID: Number(r.size),
    }));
    return { purchaseDetails, taggingDetails };
  }, [rows, headerForm, itemId]);

  const handleSave = useCallback(() => {

    const remainingByRef = remainingRef.current;

    let effectiveBalance = { ...remainingByRef };

    if (!validateHeaderWithToast(headerForm)) return;
    if (!validateRows({ rows, limits, balance:effectiveBalance })) return;
    const { purchaseDetails, taggingDetails } = buildPayload();
    setIsSubmittingTag(true);
    console.log('createTag', purchaseDetails, taggingDetails);
    createTag(
      { PURCHASEDETAILS: purchaseDetails, TAGGINGDETAILS: taggingDetails },
      {
        onSuccess: (res) => {
          toaster.create({ title: "Saved", description: "Tagging created successfully", type: "success", duration: 2000 });
          setPrintId(res?.data?.ENTRYNO);
          setPrintDetails(res?.data?.TAGDETAILS ?? []);
          // clearAll();
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
  }, [headerForm, rows, limits, validateHeaderWithToast, validateRows, buildPayload, createTag, setPrintId, setPrintDetails, clearAll, printAll]);

  const handleUpdate = useCallback(() => {

    const remainingByRef = remainingRef.current;
    console.log(remainingByRef, 'remainingByRef in update')

    let effectiveBalance = { ...remainingByRef };

    if (!validateHeaderWithToast(headerForm)) return;
    if (!validateRows({ rows, limits, balance: effectiveBalance, countOnlyNew: false })) return;
    const { purchaseDetails, taggingDetails } = buildPayload();
    setIsSubmittingTag(true);

    updateTag(
      { PURCHASEDETAILS: purchaseDetails, TAGGINGDETAILS: taggingDetails, id: Number(headerForm.ENTRYNO) },
      {
        onSuccess: (res) => {
          toaster.create({ title: "Updated", description: "Tagging updated successfully", type: "success", duration: 2000 });
          setPrintId(res?.data?.ENTRYNO);
          setPrintDetails(res?.data?.TAGDETAILS ?? []);
          // clearAll();
          // resetForm();
          setTimeout(() => printAll(res?.data?.TAGDETAILS ?? []), 500);
          handleClear();
        },
        onError: (err: any) => {
          toaster.create({ title: "Error", description: err?.message || "Update failed", type: "error", duration: 2000 });
        },
        onSettled: () => setIsSubmittingTag(false),
      }
    );
  }, [headerForm, rows, limits, validateHeaderWithToast, validateRows, buildPayload, updateTag, setPrintId, setPrintDetails, clearAll, printAll]);

  /* ── Load existing tag for edit ── */
  useEffect(() => {
    if (!tagDetails) return;
    const purchase = tagDetails.PURCHASEDETAILS;
    const apiRows = tagDetails.TAGGINGDETAILS || [];

    setHeaderForm({
      ENTRYNO: String(purchase.ENTRYNO ?? ""),
      COMPANYNAME: String(purchase.ACCODE ?? ""),
      INWARDNO: String(purchase.PUENTRYNO ?? ""),
      ITEMNAME: String(purchase.PUSNO ?? ""),
      DATE: purchase.TAGDATE ?? "",
    });

    loadApiRows(
      apiRows.map((r: any) => ({
        id: `edit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        draftRowId: String(purchase.ENTRYNO),
        grsweight: Number(r.GRSWT) || 0,
        stoneWt: Number(r.STNWT) || 0,
        salesStoneWt: Number(r.SALESSTNWT) || 0,
        wastePercent: Number(r.WASPER) || 0,
        size: String(r.SIZEID) || "",
        diamondWt: Number(r.DIAWT) || 0,
        mc: Number(r.MC) || 0,
        touch: Number(r.TOUCH) || 0,
        barcode: r.TAGNO || "",
      }))
    );
    setIsEditing(true);
    setPrintDetails(apiRows);
  }, [tagDetails]); // tagDetails reference only changes when the API response changes

  /* ── Tag selection ── */
  const handleSelectTag = useCallback((entryNo: string) => {
    console.log(rowsRef.current ,editingRowIdRef.current ,isEditing ,'hanldeSelect');
    
    if (rowsRef.current.length > 0 && !isEditing) {
      toaster.create(
        {
          title: 'Clear Tags Or Save Tags',
          type: 'info',
          description: 'Please clear the current tag before selecting a new one.',
        }
      )
    }
    else {
      if (selectedEntryNo === entryNo) {
        setSelectedEntryNo("");
        setTimeout(() => setSelectedEntryNo(entryNo), 10);
      } else {
        setSelectedEntryNo(entryNo);
      }
    }

  }, [selectedEntryNo, setSelectedEntryNo ,isEditing]);

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

  /* ── Table config ── */
  const transactionFormFields = useMemo(() =>
    transactionTableCols.map((col): any => {
      const isNum = NUMERIC_FIELDS.has(col.key);
      const isRequired = hasStone ? REQUIRED_FIELDS_STN.has(col.key) : REQUIRED_FIELDS.has(col.key);
      const base: any = {
        key: col.key, label: col.label || col.key, placeholder: col.label || col.key,
        type: isNum ? "number" : "text", isRequired, size: "xs",
        align: isNum ? "right" : "left", allowFocus: col.allowFocus,
      };
      if (col.decimalScale) base.decimalScale = col.decimalScale;
      if (col.key === "size") return { ...base, type: "combobox", align: "left", collection: itemSizeCollection };
      if (col.key === "wastePercent") return { ...base, type: "number", decimalScale: 2 };
      if (col.key === "barcode") return { ...base, type: "text", align: "left", disabled: true };
      return base;
    }),
    [itemSizeCollection, hasStone]);

  const allDisplayCols = useMemo(() =>
    transactionTableCols
      .filter((col) => isEditing || col.key !== "__print")
      .map((col) => ({
        ...col,
        align: col.key === "size" || col.key === "barcode" ? "left" as const
          : col.key === "__print" ? "center" as const : "right" as const,
      })),
    [isEditing]);

  const transactionTotals = useMemo(() => ({
    grsweight: rows.reduce((s, r) => s + r.grsweight, 0),
    stoneWt: rows.reduce((s, r) => s + r.stoneWt, 0),
    salesStoneWt: rows.reduce((s, r) => s + r.salesStoneWt, 0),
    diamondWt: rows.reduce((s, r) => s + r.diamondWt, 0),
    mc: rows.reduce((s, r) => s + r.mc, 0),
  }), [rows]);

  const showTableForm = useMemo(() => {
    // ✅ If editing a row → ALWAYS show form
    if (editRowId) return true;

    // ❌ If some other editing → hide form
    if (isEditing) return false;

    // ✅ Normal add condition
    return rows.length < safeNum(selectedItem?.PCS);
  }, [selectedItem?.PCS, rows.length, editRowId, isEditing]);

  const getCellValue = useCallback((col: any, row: BarcodeTransactionRow) => {
    if (col.key === "__print") return null;
    const value = row[col.key as keyof BarcodeTransactionRow];
    if (value === undefined || value === null) return "-";
    if (typeof value === "number") {
      if (["grsweight", "stoneWt", "salesStoneWt", "diamondWt"].includes(col.key)) return formatToFixed(value, 3);
      if (["wastePercent", "mc"].includes(col.key)) return formatToFixed(value, 2);
      if (col.key === "touch") return formatToFixed(value, 1);
    }
    if (col.key === "size" && value)
      return itemSizeCollection.find((i: any) => i.value === value)?.label ?? value;
    return value.toString();
  }, [itemSizeCollection]);

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

    purchaserCollection, inwardCollection, itemCollection, itemSizeCollection, itemSizeList,
    stockTableData,
    stockSummary, limits, remaining,

    transactionFormFields, allDisplayCols, transactionTotals, showTableForm,
    tagItemList: Array.isArray(tagEntryNos) ? tagEntryNos : EMPTY_ARRAY,
    fieldRefs,

    handleHeaderChange, handleFormChange, resetForm,
    handleRowSubmit, moveToNext,
    handleEditRow, handleDeleteRow,
    handleExcelLoad, handleSave, handleUpdate, handleClear, handleSelectTag,
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