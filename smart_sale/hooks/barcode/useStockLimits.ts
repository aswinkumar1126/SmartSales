

import { useMemo } from "react";
import type { BarcodeTransactionRow } from "@/store/barcode/useBarcodeStore";
import { SELECTED_BARCODE_ITEM } from "@/types/barcode/BarcodeDetails";
/* ============================================================
   TYPES
   ============================================================ */



export interface StockSummaryRow {
  key: string;
  label: string;
  total: string;
  newRows: string;
  balance: string;
}

/* ============================================================
   HOOK
   ============================================================ */

const safeNum = (v: unknown) => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};
const normalize = (v: number, precision = 3) =>
  parseFloat(v.toFixed(precision));

const formatToFixed = (val: number, digits = 3) => {
  const num = Number(val);


  return num.toFixed(digits);
};

export function useStockLimits(
  selectedItem: SELECTED_BARCODE_ITEM | null,
  rows: BarcodeTransactionRow[],
  editId?: string // 🔥 pass this when editing
) {
  const itemList = useMemo<SELECTED_BARCODE_ITEM[]>(() => {
    if (!selectedItem) return [];
    return Array.isArray(selectedItem) ? selectedItem : [selectedItem];
  }, [selectedItem]);



  // 🔥 IMPORTANT: exclude editing row from calculation
  const effectiveRows = useMemo(() => {
    if (!editId) return rows;
    return rows.filter((r) => r.id !== editId);
  }, [rows, editId]);

  
 
  /* ================= LOT ================= */
  const lot = useMemo(
    () => ({
      PCS: itemList.reduce((s, i) => s + safeNum(i.PCS), 0),
      GRSWT: itemList.reduce((s, i) => s + safeNum(i.GRSWT), 0),
      STNWT: itemList.reduce((s, i) => s + safeNum(i.STNWT), 0),
      NETWT: itemList.reduce((s, i) => s + safeNum(i.NETWT), 0),
    }),
    [itemList]
  );


 

  /* ================= NEW ================= */
  const added = useMemo(
    () => ({
      PCS: effectiveRows.length,
      GRSWT: effectiveRows.reduce((s, r) => s + r.grsweight, 0),
      STNWT: effectiveRows.reduce((s, r) => s + r.purchaseStoneWt, 0),
      NETWT: effectiveRows.reduce((s, r) => s + (r.grsweight - r.purchaseStoneWt), 0),
    }),
    [effectiveRows]
  );

  console.log(lot,added , 'addedandlot');

  /* ================= SUMMARY ================= */
  const summary: StockSummaryRow[] = useMemo(() => {
    const keys: Array<{
      key: keyof typeof lot;
      label: string;
      isPCS?: boolean;
    }> = [
        { key: "PCS", label: "Pieces", isPCS: true },
        { key: "GRSWT", label: "Gross Wt" },
        { key: "STNWT", label: "Stone Wt" },
      ];
    return keys.map(({ key, label, isPCS }) => {
      const t = lot[key];

      const nw = added[key];
      const bal = formatToFixed( normalize(t) - normalize(nw));

      const fmt = (v: number) =>
        isPCS ? v : formatToFixed(v, 3);

      return {
        key,
        label,
        total: fmt(t),

        newRows: fmt(nw),
        balance: fmt(Number(bal)),
      };
    });
  }, [lot, added]);

  /* ================= LIMITS ================= */
  const limits = useMemo(
    () => ({
      PCS: lot.PCS,
      GRSWT: lot.GRSWT,  
      STNWT: lot.STNWT,
    }),
    [lot]
  );

  /* ================= REMAINING ================= */
  const remaining = useMemo(
    () => ({
      PCS: Number(formatToFixed(lot.PCS  - added.PCS)),
      GRSWT: Number(formatToFixed( lot.GRSWT - added.GRSWT)), // 🔥 ADDED
      STNWT: Number(formatToFixed(lot.STNWT - added.STNWT)),
    }),
    [lot, added]
  );
  console.log(remaining, lot, added,'remainingremaining')



  return {
    summary,
    limits,
    remaining,

  };
}