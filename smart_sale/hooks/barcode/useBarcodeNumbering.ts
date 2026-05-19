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

  const assignBarcodes = useCallback(
    (rows: BarcodeTransactionRow[]): BarcodeTransactionRow[] => {
      if (!isReady) return rows;

      let newCounter = 0;

      return rows.map((row) => {
        // isTaged = existing saved row — never touch its barcode
        if ((row as any).isTaged) return row;

        // In edit mode, only isNew rows get a barcode
        if (isEditing && !row.isNew) return row;

        newCounter++;
        return { ...row, barcode: `${prefix}${startNumber + newCounter}` };
      });
    },
    [prefix, startNumber, isEditing, isReady]
  );

  const assignSingleBarcode = useCallback(
    (existingCount: number, isEditing: boolean): string => {
      if (!isReady) return "";

      // CREATE MODE: count up from all existing non-tagged rows
      if (!isEditing) {
        return `${prefix}${startNumber + existingCount + 1}`;
      }

      // EDIT MODE: API returns startNumber already accounting for saved rows,
      // so startNumber + 1 is always the correct next slot.
      // existingCount here = rows added so far in this edit session (non-isTaged new rows)
      return `${prefix}${startNumber + existingCount + 1}`;
    },
    [prefix, startNumber, isReady]
  );

  return { assignBarcodes, assignSingleBarcode };
}