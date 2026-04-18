/**
 * useBarcodeNumbering.ts
 * Manages barcode prefix + sequential numbering.
 * Keeps isNew rows' barcodes in sync when rows are added/deleted.
 */

import { useCallback } from "react";
import type { BarcodeTransactionRow } from "@/store/barcode/useBarcodeStore";

interface BarcodeNumberingOptions {
  prefix: string;
  /** The TAGNO value from the API — the last used number */
  startNumber: number;
  isEditing: boolean;
}

export function useBarcodeNumbering({
  prefix,
  startNumber,
  isEditing,
}: BarcodeNumberingOptions) {
 
console.log(prefix ,startNumber ,'numbering');
  const assignBarcodes = useCallback(
    (rows: BarcodeTransactionRow[]): BarcodeTransactionRow[] => {
      if (!isEditing) {
        // Create mode: assign all sequentially
        return rows.map((row, i) => ({
          ...row,
          barcode: `${prefix}${startNumber + i + 1}`,
        }));
      }

      // Edit mode: only touch isNew rows
      let newRowCounter = 0;
      const savedCount = rows.filter((r) => !r.isNew).length;

      return rows.map((row) => {
        if (!row.isNew) return row; // preserve existing barcode
        newRowCounter++;
        return {
          ...row,
          barcode: `${prefix}${startNumber + savedCount + newRowCounter}`,
        };
      });
    },
    [prefix, startNumber, isEditing]
  );

  
  const assignSingleBarcode = useCallback(
    (existingCount: number): string => {
      return `${prefix}${startNumber + existingCount + 1}`;
    },
    [prefix, startNumber]
  );

  return { assignBarcodes, assignSingleBarcode };
}