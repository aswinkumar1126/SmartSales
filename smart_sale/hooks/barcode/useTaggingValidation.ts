import { useCallback } from "react";
import { toaster } from "@/components/ui/toaster";
import type { BarcodeHeaderForm, BarcodeTransactionRow } from '@/store/barcode/useBarcodeStore';
import { formatToFixed } from "@/utils/format/numberFormat";

/* ============================================================
   TYPES
   ============================================================ */

export type HeaderErrors = Partial<Record<keyof BarcodeHeaderForm, string>>;

export interface RowValidationOptions {
  rows: BarcodeTransactionRow[];
  limits: {
    PCS: number;
    STNWT: number;
    GRSWT: number;
  };
  countOnlyNew?: boolean;
  incomingRows?: Pick<BarcodeTransactionRow, "grsweight" | "purchaseStoneWt" | "salesStoneWt">[];
  balance?: {
    PCS: number;
    STNWT: number;
    GRSWT: number;
  };
  tolerance: number;
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
  // In useTaggingValidation.ts, update validateSingleRow
  const validateSingleRow = useCallback(
    (
      data: {
        rowId ?: string|null ,
        grsweight: string;
        purchaseStoneWt: string;
        salesStoneWt: string;
      },
      hasStone: boolean,
      balance: {
        PCS: number;
        STNWT: number;
        GRSWT: number;
      },
      limits: {
        PCS: number;
        STNWT: number;
        GRSWT: number;
      },
      rows:any ,
      tolerance: number = 0
    ): Record<string, string> => {
      const errors: Record<string, string> = {};

      console.log(data, hasStone, balance, limits,rows, 'from validation');

      const filteredRows = data.rowId
        ? rows.filter((r: any) => r.id !== data.rowId)
        : rows;

      const existingGrsTotal = filteredRows.reduce(
        (sum: number, row: any) =>
          sum + Number(row.grsweight || 0),
        0
      );


      const grs = Number(data.grsweight || 0);
      const purchaseStnWt = Number(data.purchaseStoneWt || 0);
      const salesStnWt = Number(data.salesStoneWt || 0);

      const finalGrsTotal = existingGrsTotal + grs;

     

      // ✅ SAFE LIMITS
      const grsLimit = Number(limits?.GRSWT || 0);
      const balanceStnWt = Number(balance?.STNWT || 0);

      const grsUpperLimit = Number(
        (grsLimit + (tolerance || 0)).toFixed(3)
      );
      
      console.log(finalGrsTotal, grsUpperLimit, 'totals');

      // If no stone, ensure stone values are 0
      if (!hasStone) {
        // We still validate that values are 0, but don't show errors to user
        // Instead, we ensure values are set to 0 in the form
        if (purchaseStnWt !== 0 || salesStnWt !== 0) {
          // Force values to 0 silently
          data.purchaseStoneWt = "0";
          data.salesStoneWt = "0";
        }
      }

      /* =========================
         GROSS WEIGHT VALIDATION
      ========================= */
      if (grs <= 0) {
        errors.grsweight =
          "Gross weight must be greater than 0";
      } else if (finalGrsTotal > grsUpperLimit) {
        errors.grsweight =
          `Total gross weight cannot exceed ${grsUpperLimit}g`;
      }

      /* =========================
         STONE VALIDATION
      ========================= */
      if (hasStone) {
        // PURCHASE STONE WT
        if (purchaseStnWt > balanceStnWt) {
          errors.purchaseStoneWt = `Purchase stone weight cannot exceed balance stone weight (${balanceStnWt})`;
        }

        // SALES STONE WT
        if (salesStnWt > purchaseStnWt) {
          errors.stoneWt = "Sales stone weight cannot exceed purchase stone weight";
        } else if (salesStnWt > balanceStnWt) {
          errors.stoneWt = `Sales stone weight cannot exceed balance stone weight (${balanceStnWt})`;
        }
      }

      return errors;
    },
    []
  );
  // Add isUpdate parameter to RowValidationOptions interface
  interface RowValidationOptions {
    rows: any[];
    limits: any;
    countOnlyNew?: boolean;
    incomingRows?: any[];
    balance?: any;
    tolerance?: number;
    isUpdate?: boolean; // Add this
  }

  const validateRows = useCallback(
    ({
      rows,
      limits,
      countOnlyNew = false,
      incomingRows = [],
      balance,
      tolerance = 0,
      isUpdate = false,
    }: RowValidationOptions): boolean => {

      // ✅ IMPORTANT FIX
      // During update, incomingRows already contains the updated full dataset.
      // So do NOT merge with existing rows again.
      const allRows =
        isUpdate && incomingRows.length > 0
          ? incomingRows
          : [...rows, ...incomingRows];

      if (allRows.length === 0) {
        toaster.create({
          title: "Validation Error",
          description: "At least one transaction row is required",
          type: "error",
          duration: 2000,
        });

        return false;
      }

      const grsLimit = (limits.GRSWT || 0) + (tolerance ?? 0);

      let hasError = false;

      // ✅ Row validation
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

        if ((row.purchaseStoneWt || 0) < 0) {
          hasError = true;

          toaster.create({
            title: `Row ${n} Error`,
            description: "Purchase stone weight must be ≥ 0",
            type: "error",
            duration: 2000,
          });
        }

        if ((row.purchaseStoneWt || 0) > (row.grsweight || 0)) {
          hasError = true;

          toaster.create({
            title: `Row ${n} Error`,
            description:
              "Purchase stone weight cannot exceed gross weight",
            type: "error",
            duration: 2000,
          });
        }

        if ((row.salesStoneWt || 0) > (row.purchaseStoneWt || 0)) {
          hasError = true;

          toaster.create({
            title: `Row ${n} Error`,
            description:
              "Sales stone weight cannot exceed purchase stone weight",
            type: "error",
            duration: 2000,
          });
        }
      });

      if (hasError) return false;

      // ✅ Limit checks
      const rowsForLimitCheck = countOnlyNew
        ? allRows.filter((r) => ("isNew" in r ? r.isNew : true))
        : allRows;

      console.log(rowsForLimitCheck, "rowsForLimitCheck");

      const totalPCS = rowsForLimitCheck.length;

      const totalPurchaseStoneWt = rowsForLimitCheck.reduce(
        (s, r) => s + (r.purchaseStoneWt || 0),
        0
      );

      const totalGrsWt = rowsForLimitCheck.reduce(
        (s, r) => s + (r.grsweight || 0),
        0
      );

      console.log(
        totalPCS,
        totalGrsWt,
        totalPurchaseStoneWt,
        limits,
        "limit check",
        {
          isUpdate,
          countOnlyNew,
        }
      );

      if (limits.PCS && totalPCS > limits.PCS) {
        toaster.create({
          title: "Lot PCS Exceeded",
          description: `${totalPCS} pieces exceed the allowed ${limits.PCS}`,
          type: "error",
          duration: 2000,
        });

        return false;
      }

      if (limits.GRSWT && totalGrsWt > grsLimit) {
        toaster.create({
          title: "Lot GrsWt Exceeded",
          description:
            `Total ${formatToFixed(totalGrsWt, 3)} exceeds allowed ` +
            `${formatToFixed(limits.GRSWT, 3)} + tolerance ` +
            `${formatToFixed(tolerance ?? 0, 3)} = ` +
            `${formatToFixed(grsLimit, 3)}`,
          type: "error",
          duration: 2000,
        });

        return false;
      }

      if (limits.STNWT && totalPurchaseStoneWt > limits.STNWT) {
        toaster.create({
          title: "Lot Purchase Stone Weight Exceeded",
          description:
            `Purchase stone weight ${totalPurchaseStoneWt.toFixed(3)} ` +
            `exceeds allowed ${limits.STNWT}`,
          type: "error",
          duration: 2000,
        });

        return false;
      }

      // ✅ Balance checks
      if (balance && balance.PCS > 0 && balance.GRSWT === 0) {
        toaster.create({
          title: "Invalid Entry",
          description:
            "Gross weight cannot be 0 when pieces are present",
          type: "error",
          duration: 2000,
        });

        return false;
      }

      if (balance && balance.GRSWT > 0 && balance.PCS === 0) {
        toaster.create({
          title: "Invalid Entry",
          description: "Pcs cannot be 0 when GrsWt are present",
          type: "error",
          duration: 2000,
        });

        return false;
      }
      if (balance && balance.STNWT > 0 && balance.PCS === 0) {
        toaster.create({
          title: "Invalid Entry",
          description:
            "Pcs cannot be 0 when Stone Weight are present",
          type: "error",
          duration: 2000,
        });

        return false;
      }
      if (
        balance &&
        balance.PCS === 0 &&
        balance.GRSWT === 0 &&
        balance.STNWT > 0
      ) {
        toaster.create({
          title: "Invalid Entry",
          description:
            "Stone Weight must be 0 when both PCS and Gross Weight are 0",
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