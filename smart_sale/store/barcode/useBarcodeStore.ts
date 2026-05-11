
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";

/* ============================================================
   TYPES
   ============================================================ */

export interface BarcodeHeaderForm {
  ENTRYNO: string;
  DATE: string;
  COMPANYNAME: string;
  INWARDNO: string;
  ITEMNAME: string;
  RETAG: boolean;
}


export interface BarcodeTransactionRow {
  id: string;
  draftRowId: string;
  barcode: string;
  grsweight: number;
  stoneWt: number;
  salesStoneWt: number;
  wastePercent: number;
  size: string;
  diamondWt: number;
  mc: number;
  touch: number;
  isNew: boolean;
  print?: boolean;
}

export interface BarcodePrintDetail {
  TAGNO: string;
  GRSWT: number;
  STNWT: number;
  WASPER: number;
  DIAWT: number;
  MC: number;
  TOUCH: number;
  SALESSTNWT: number;
  NETWT: number;
  SIZEID: number;
  UPTIME?: string;
  USERID?: number;
}

export interface TagFilterParams {
  FROMDATE: string;
  TODATE: string;
  ITEMID: string;
  ACCODE: string;
  ENTRYNO: string;
  WEIGHT: string;
  PUENTRYNO: string;
  TAGNO: string;
  SEARCH: string;
  
}

/* ============================================================
   CONSTANTS
   ============================================================ */

const today = new Date().toISOString().split("T")[0];

export const EMPTY_HEADER: BarcodeHeaderForm = {
  ENTRYNO: "", DATE: today, COMPANYNAME: "", INWARDNO: "", ITEMNAME: "", RETAG: false,
};

export const EMPTY_FILTER_PARAMS: TagFilterParams = {
  FROMDATE: "", TODATE: "", ITEMID: "", ACCODE: "",
  ENTRYNO: "", WEIGHT: "", PUENTRYNO: "", TAGNO: "", SEARCH: "",
};

/* ============================================================
   STORE SHAPE
   ============================================================ */

interface BarcodeState {

  headerForm: BarcodeHeaderForm;
  setHeaderField: (field: keyof BarcodeHeaderForm, value: string) => void;
  setHeaderForm: (form: BarcodeHeaderForm) => void;

  rows: BarcodeTransactionRow[];
  addRow: (row: Omit<BarcodeTransactionRow, "id" | "isNew">) => void;
  updateRow: (id: string, patch: Partial<BarcodeTransactionRow>) => void;
  deleteRow: (id: string) => void;
  setRows: (rows: BarcodeTransactionRow[]) => void;
  loadApiRows: (rows: Omit<BarcodeTransactionRow, "isNew">[]) => void;

  printId: number | null;
  setPrintId: (id: number | null) => void;
  printDetails: BarcodePrintDetail[];
  setPrintDetails: (details: BarcodePrintDetail[]) => void;

  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  selectedEntryNo: string;
  setSelectedEntryNo: (val: string) => void;

  singleSearch: string;
  setSingleSearch: (val: string) => void;
  tagFilterParams: TagFilterParams;
  setTagFilterField: (field: string, value: string) => void;

  hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;

  clearAll: () => void;
}

/* ============================================================
   STORE
   ============================================================ */

export const useBarcodeStore = create<BarcodeState>()(
  persist(
    (set) => ({
      headerForm: EMPTY_HEADER,
      setHeaderField: (field, value) =>
        set((s) => ({ headerForm: { ...s.headerForm, [field]: value } })),
      setHeaderForm: (form) => set({ headerForm: form }),

      rows: [],
      addRow: (rowData) => {
        const id = `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        set((s) => ({ rows: [...s.rows, { ...rowData, id, isNew: true }] }));
      },
      updateRow: (id, patch) =>
        set((s) => ({ rows: s.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      deleteRow: (id) =>
        set((s) => ({ rows: s.rows.filter((r) => r.id !== id) })),
      setRows: (rows) => set({ rows }),
      loadApiRows: (rows) =>
        set({ rows: rows.map((r) => ({ ...r, isNew: false })) }),

      printId: null,
      setPrintId: (id) => set({ printId: id }),
      printDetails: [],
      setPrintDetails: (details) => set({ printDetails: details }),

      isEditing: false,
      setIsEditing: (val) => set({ isEditing: val }),
      
      selectedEntryNo: "",
      setSelectedEntryNo: (val) => set({ selectedEntryNo: val }),

      singleSearch: "",
      setSingleSearch: (val) => set({ singleSearch: val }),
      tagFilterParams: EMPTY_FILTER_PARAMS,
      setTagFilterField: (field, value) =>
        set((s) => ({ tagFilterParams: { ...s.tagFilterParams, [field]: value } })),

      hasHydrated: false,
      setHasHydrated: (val: boolean) => set({ hasHydrated: val }),

      clearAll: () =>
        set({
          headerForm: { ...EMPTY_HEADER, DATE: new Date().toISOString().split("T")[0] },
          rows: [],
          isEditing: false,
          selectedEntryNo: "",
          singleSearch: "",
          printId: null,
          
        }),
    }),
    {
      name: "barcode-store",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({
        headerForm: s.headerForm,
        rows: s.rows,
        printId: s.printId,
        printDetails: s.printDetails,
        isEditing: s.isEditing,
        selectedEntryNo: s.selectedEntryNo,
        singleSearch: s.singleSearch,
        tagFilterParams: s.tagFilterParams,
      }),
    }
  )
);



/** Rows that came from the API (isNew = false). */
export const useSavedRows = () =>
  useBarcodeStore(useShallow((s) => s.rows.filter((r) => !r.isNew)));

/** Rows added this session (isNew = true). */
export const useNewRows = () =>
  useBarcodeStore(useShallow((s) => s.rows.filter((r) => r.isNew)));

/** Primitive aggregates — safe without shallow (return numbers). */
export const useTotalGrsWt = () =>
  useBarcodeStore((s) => s.rows.reduce((acc, r) => acc + r.grsweight, 0));

export const useTotalStoneWt = () =>
  useBarcodeStore((s) => s.rows.reduce((acc, r) => acc + r.stoneWt, 0));