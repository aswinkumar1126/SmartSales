import { useCallback } from "react";
import type { BarcodeTransactionRow } from "@/store/barcode/useBarcodeStore";

interface BarcodeNumberingOptions {
  prefix: string;
  startNumber: number;
  isEditing: boolean;
  savedRowsInEditing?: number;
}

export function useBarcodeNumbering({
  prefix,
  startNumber,
  isEditing,
  savedRowsInEditing,
}: BarcodeNumberingOptions) {

  const isReady =
    typeof prefix === "string" &&
    prefix.trim().length > 0 &&
    typeof startNumber === "number" &&
    !isNaN(startNumber);

  const assignBarcodes = useCallback(
    (rows: BarcodeTransactionRow[]): BarcodeTransactionRow[] => {

      // Prevent running before values are ready
      if (!isReady) return rows;

      /**
       * =========================
       * CREATE MODE
       * =========================
       */
      if (!isEditing) {
        return rows.map((row, i) => ({
          ...row,
          barcode: `${prefix}${startNumber + (i + 1)}`,
        }));
      }

      /**
       * =========================
       * EDIT MODE
       * =========================
       * Use backend-provided saved count instead of recalculating
       */
      const savedCount = 3;

      console.log(savedCount, isEditing, startNumber,'savedCount');
      let newRowCounter = 0;

      return rows.map((row) => {
        if (!row.isNew) return row;
        console.log(row,'rowinassinging');

        newRowCounter++;

        return {
          ...row,
          barcode: `${prefix}${startNumber + 1 - savedCount + newRowCounter}`,
        };
      });
    },
    [prefix, startNumber, isEditing, isReady, savedRowsInEditing]
  );

  /**
   * Assign single barcode
   */
  const assignSingleBarcode = useCallback(
    (
      existingCount: number,
      isEditing: boolean,
      savedCount: number
    ): string => {
      if (!isReady) return "";

      console.log(startNumber, existingCount,
isEditing,
        savedCount,'startNumber');

      /**
       * CREATE MODE
       */
      if (!isEditing) {
        return `${prefix}${startNumber + existingCount + 1}`;
      }

      /**
       * EDIT MODE
       * Only new rows should continue after saved rows
       */
      const newCount = existingCount - savedCount ;

      return `${prefix}${startNumber + 1 + newCount}`;
    },
    [prefix, startNumber, isReady]
  );
  return { assignBarcodes, assignSingleBarcode };
}