
import { useCallback } from "react";
import { toaster } from "@/components/ui/toaster";
import type { BarcodeHeaderForm, BarcodeTransactionRow } from '@/store/barcode/useBarcodeStore';

/* ============================================================
   TYPES
   ============================================================ */

export type HeaderErrors = Partial<Record<keyof BarcodeHeaderForm, string>>;

export interface RowValidationOptions {
  /** All rows in the current session (saved + new, or just new for add-only check) */
  rows: BarcodeTransactionRow[];
 

  limits: {
    PCS: number;
    STNWT: number;
    GRSWT: number;
  };
 
  countOnlyNew?: boolean;
  
  incomingRows?: Pick<BarcodeTransactionRow, "grsweight" | "stoneWt" | "salesStoneWt">[];
}

/* ============================================================
   HOOK
   ============================================================ */

export function useTaggingValidation() {
 

  const validateHeader = useCallback(
    (form: BarcodeHeaderForm): HeaderErrors => {
      const errors: HeaderErrors = {};
      if (!form.COMPANYNAME) errors.COMPANYNAME = "Purchaser is required";
      if (!form.INWARDNO) errors.INWARDNO = "Inward is required";
      if (!form.ITEMNAME) errors.ITEMNAME = "Item is required";
      return errors;
    },
    []
  );


  const validateHeaderWithToast = useCallback(
    (form: BarcodeHeaderForm): boolean => {
      const errors = validateHeader(form);
      if (Object.keys(errors).length > 0) {
        toaster.create({
          title: "Validation Error",
          description: "Please fill all required header fields",
          type: "error",
          duration: 2000,
        });
        return false;
      }
      return true;
    },
    [validateHeader]
  );

  
  const validateSingleRow = useCallback(
    (
      data: { grsweight: string; stoneWt: string; salesStoneWt: string },
      hasStone: boolean,
      balance: {
        PCS: number;
        STNWT: number;
        GRSWT: number;
      }
    ): Record<string, string> => {

    console.log(balance,'limitsinvalidate');

      const errors: Record<string, string> = {};

    const grs = Number(data.grsweight || 0);
    const stn = Number(data.stoneWt || 0);
    const sales = Number(data.salesStoneWt || 0);

    // 🔹 Gross weight
    if (!grs || grs <= 0) {
      errors.grsweight = "Weight must be greater than 0";
    }

    // ✅ ADD THIS (your missing logic)
    if (balance && grs > balance.GRSWT) {
      errors.grsweight = `Only ${balance.GRSWT} remaining`;
    }

    if (hasStone) {
      if (stn < 0) {
        errors.stoneWt = "Stone weight must be ≥ 0";
      }

      if (sales < 0) {
        errors.salesStoneWt = "Sales stone weight must be ≥ 0";
      }

      if (stn > grs) {
        errors.stoneWt = "Stone weight cannot exceed gross weight";
      }

      if (sales > stn) {
        errors.salesStoneWt = "Sales stone weight cannot exceed stone weight";
      }

      // ✅ ALSO ADD THIS
      if (balance && stn > balance.STNWT) {
        errors.stoneWt = `Only ${balance.STNWT} stone weight remaining`;
      }
    }

    return errors;
  },
  []
);

  
  const validateRows = useCallback(
    ({
      rows,
      limits,
      countOnlyNew = false,
      incomingRows = [],
    }: RowValidationOptions): boolean => {
      const allRows = [...rows, ...incomingRows];

      if (allRows.length === 0) {
        toaster.create({
          title: "Validation Error",
          description: "At least one transaction row is required",
          type: "error",
          duration: 2000,
        });
        return false;
      }

      let hasError = false;

      allRows.forEach((row, idx) => {
        const n = idx + 1;

        if (!row.grsweight || row.grsweight <= 0) {
          hasError = true;
          toaster.create({
            title: `Row ${n} Error`,
            description: "Gross weight must be greater than 0",
            type: "error",
            duration: 2000,
          });
        }

        if (row.stoneWt < 0) {
          hasError = true;
          toaster.create({
            title: `Row ${n} Error`,
            description: "Stone weight must be ≥ 0",
            type: "error",
            duration: 2000,
          });
        }

        if (row.stoneWt > row.grsweight) {
          hasError = true;
          toaster.create({
            title: `Row ${n} Error`,
            description: "Stone weight cannot exceed gross weight",
            type: "error",
            duration: 2000,
          });
        }

        if (row.salesStoneWt > row.stoneWt) {
          hasError = true;
          toaster.create({
            title: `Row ${n} Error`,
            description: "Sales stone weight cannot exceed stone weight",
            type: "error",
            duration: 2000,
          });
        }
      });

      if (hasError) return false;

      // ── Limit checks ──
      
      const rowsForLimitCheck = countOnlyNew
        ? allRows.filter((r) => ("isNew" in r ? r.isNew : true))
        : allRows;

      const totalPCS = rowsForLimitCheck.length;
      const totalStoneWt = rowsForLimitCheck.reduce((s, r) => s + r.stoneWt, 0);

      if (limits.PCS && totalPCS > limits.PCS) {
        toaster.create({
          title: "Lot PCS Exceeded",
          description: `${totalPCS} pieces exceed the allowed ${limits.PCS}`,
          type: "error",
          duration: 2000,
        });
        return false;
      }

      if (limits.STNWT && totalStoneWt > limits.STNWT) {
        toaster.create({
          title: "Lot Stone Weight Exceeded",
          description: `Stone weight ${totalStoneWt.toFixed(3)} exceeds allowed ${limits.STNWT}`,
          type: "error",
          duration: 2000,
        });
        return false;
      }

      return true;
    },
    []
  );

  return { validateHeader, validateHeaderWithToast, validateSingleRow, validateRows };
}