import { useCallback } from "react";
import type { BarcodeTransactionRow } from "@/store/barcode/useBarcodeStore";

interface BarcodeNumberingOptions {
  prefix: string;
  startNumber: number;
  isEditing: boolean;
}

export function useBarcodeNumbering({
  prefix,
  startNumber,
  isEditing,
}: BarcodeNumberingOptions) {

 
  const isReady =
    typeof prefix === "string" &&
    prefix.trim().length > 0 &&
    typeof startNumber === "number" &&
    !isNaN(startNumber);

  console.log(isReady, prefix, startNumber ,'isReady');
 
  const assignBarcodes = useCallback(
    (rows: BarcodeTransactionRow[]): BarcodeTransactionRow[] => {

      // 🔥 IMPORTANT: prevent running before Zustand hydration completes
      if (!isReady) return rows;

      if (!isEditing) {
        return rows.map((row, i) => ({
          ...row,
          barcode: `${prefix}${startNumber + i + 1}`,
        }));
      }

      let newRowCounter = 0;
      const savedCount = rows.filter((r) => !r.isNew).length;

      return rows.map((row) => {
        if (!row.isNew) return row;

        newRowCounter++;
        return {
          ...row,
          barcode: `${prefix}${startNumber + savedCount + newRowCounter}`,
        };
      });
    },
    [prefix, startNumber, isEditing, isReady]
  );

  /**
   * Assign single barcode
   */
  const assignSingleBarcode = useCallback(
    (existingCount: number): string => {
      if (!isReady) return "";

      return `${prefix}${startNumber + existingCount + 1}`;
    },
    [prefix, startNumber, isReady]
  );

  return { assignBarcodes, assignSingleBarcode };
}