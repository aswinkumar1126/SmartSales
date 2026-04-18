

import { useMemo } from "react";
import { formatToFixed } from "@/utils/format/numberFormat";
import type { BarcodeTransactionRow } from "@/store/barcode/useBarcodeStore";
import { SELECTED_BARCODE_ITEM } from "@/types/barcode/BarcodeDetails";
/* ============================================================
   TYPES
   ============================================================ */



export interface StockSummaryRow {
  key: string;
  label: string;
  total: string;
  saved: string;
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

  const savedRows = useMemo(
    () => effectiveRows.filter((r) => !r.isNew),
    [effectiveRows]
  );

  const newRows = useMemo(
    () => effectiveRows.filter((r) => r.isNew),
    [effectiveRows]
  );

  console.log(newRows,'newRows');

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

  /* ================= SAVED ================= */
  const saved = useMemo(
    () => ({
      PCS: savedRows.length,
      GRSWT: savedRows.reduce((s, r) => s + r.grsweight, 0),
      STNWT: savedRows.reduce((s, r) => s + r.stoneWt, 0),
      NETWT: savedRows.reduce((s, r) => s + (r.grsweight - r.stoneWt), 0),
    }),
    [savedRows]
  );

  /* ================= NEW ================= */
  const added = useMemo(
    () => ({
      PCS: newRows.length,
      GRSWT: newRows.reduce((s, r) => s + r.grsweight, 0),
      STNWT: newRows.reduce((s, r) => s + r.stoneWt, 0),
      NETWT: newRows.reduce((s, r) => s + (r.grsweight - r.stoneWt), 0),
    }),
    [newRows]
  );

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
      const sv = saved[key];
      const nw = added[key];
      const bal = Math.max(0, t - nw);

      const fmt = (v: number) =>
        isPCS ? Math.round(v).toString() : formatToFixed(v, 3);

      return {
        key,
        label,
        total: fmt(t),
        saved: fmt(sv),
        newRows: fmt(nw),
        balance: fmt(bal,
        ),
      };
    });
  }, [lot, saved, added]);

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
      PCS: Math.max(0, lot.PCS  - added.PCS),
      GRSWT: Math.max(0, lot.GRSWT - added.GRSWT), // 🔥 ADDED
      STNWT: Math.max(0, lot.STNWT - added.STNWT),
    }),
    [lot, saved, added]
  );



  return {
    summary,
    limits,
    remaining,

  };
}