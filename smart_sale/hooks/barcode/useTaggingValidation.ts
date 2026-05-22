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
  stnTolerance :number ;
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
      tolerance: number = 0,
      stoneTolerance :number = 0,
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

      console.log(balanceStnWt ,'balanceStoneWT');

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

      console.log(purchaseStnWt, salesStnWt,'purchaseStnWt')
      /* =========================
         STONE VALIDATION
      ========================= */
      if (hasStone) {
        // PURCHASE STONE WT
        if (purchaseStnWt > balanceStnWt) {
          errors.purchaseStoneWt = `Purchase stone weight cannot exceed balance stone weight (${balanceStnWt})`;
        }

        if (purchaseStnWt && salesStnWt <= 0) {
          errors.purchaseStoneWt = `Must wants to enter the sales stone weight while purchase stone weight present`
        }

        // SALES STONE WT
        if (salesStnWt > purchaseStnWt) {
          errors.stoneWt = "Sales stone weight cannot exceed purchase stone weight";
        } else if (salesStnWt > balanceStnWt) {
          errors.stoneWt = `Sales stone weight cannot exceed balance stone weight (${balanceStnWt})`;
        }

        if(purchaseStnWt >= salesStnWt  ){
          const stnDiff = Number((purchaseStnWt-salesStnWt)).toFixed(3) ;
          console.log(Math.max(Number(stnDiff)), stoneTolerance, purchaseStnWt, salesStnWt,'stnDiff')
          if(Number(stnDiff) > stoneTolerance){
            const differece = Number(stnDiff) - stoneTolerance ;
            errors.stoneWt = `Sales stone weight cannot exceed stone tolerance ${differece.toFixed(3)} `;
          }
        }
      }

      return errors;
    },
    []
  );
  // Add isUpdate parameter to RowValidationOptions interface
  // Add isUpdate parameter to RowValidationOptions interface
  interface RowValidationOptions {
    rows: any[];
    limits: any;
    countOnlyNew?: boolean;
    incomingRows?: any[];
    balance?: any;
    tolerance?: number;
    isUpdate?: boolean;
    stnTolerance?: number;
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
      stnTolerance = 0,
    }: RowValidationOptions): boolean => {

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

      const absTolerance = Math.abs(tolerance ?? 0);
      const grsUpperLimit = (limits.GRSWT || 0) + absTolerance;
      const grsLowerLimit = (limits.GRSWT || 0) - absTolerance;

      const absStnTolerance = Math.abs(stnTolerance ?? 0);
      const stnUpperLimit = (limits.STNWT || 0) + absStnTolerance;
      const stnLowerLimit = (limits.STNWT || 0) - absStnTolerance;

      let hasError = false;

      // ✅ Row-level validation
      allRows.forEach((row, idx) => {
        const n = idx + 1;
        const grsWt = Number(row.grsweight || 0);
        const purchaseStnWt = Number(row.purchaseStoneWt || 0);
        const salesStnWt = Number(row.salesStoneWt || 0);

        // GRS WT must be > 0
        if (grsWt <= 0) {
          hasError = true;
          toaster.create({
            title: `Row ${n} Error`,
            description: "Gross weight must be greater than 0",
            type: "error", duration: 2000,
          });
        }

        // PURCHASE STONE WT must be >= 0
        if (purchaseStnWt < 0) {
          hasError = true;
          toaster.create({
            title: `Row ${n} Error`,
            description: "Purchase stone weight must be ≥ 0",
            type: "error", duration: 2000,
          });
        }

        // PURCHASE STONE WT must not exceed GRS WT
        if (purchaseStnWt > grsWt) {
          hasError = true;
          toaster.create({
            title: `Row ${n} Error`,
            description: "Purchase stone weight cannot exceed gross weight",
            type: "error", duration: 2000,
          });
        }

        // ✅ FIX: SALES STONE WT must be <= PURCHASE STONE WT (not greater than)
        if (salesStnWt > purchaseStnWt) {
          hasError = true;
          toaster.create({
            title: `Row ${n} Error`,
            description: `Row ${n}: Sales stone weight (${salesStnWt}) cannot exceed purchase stone weight (${purchaseStnWt})`,
            type: "error", duration: 3000,
          });
        }

        // IF PURCHASE STONE WT exists, SALES STONE WT must also exist
        if (purchaseStnWt > 0 && salesStnWt <= 0) {
          hasError = true;
          toaster.create({
            title: `Row ${n} Error`,
            description: "Must enter sales stone weight when purchase stone weight is present",
            type: "error", duration: 2000,
          });
        }

        // SALES STONE WT cannot exist without PURCHASE STONE WT
        if (salesStnWt > 0 && purchaseStnWt <= 0) {
          hasError = true;
          toaster.create({
            title: `Row ${n} Error`,
            description: "Purchase stone weight is required when sales stone weight is entered",
            type: "error", duration: 2000,
          });
        }

        // ✅ NEW: Each row's purchase stone wt must be >= sales stone wt (explicit per-row check)
        if (purchaseStnWt > 0 && salesStnWt > 0 && purchaseStnWt < salesStnWt) {
          hasError = true;
          toaster.create({
            title: `Row ${n} Stone Weight Error`,
            description: `Row ${n}: Purchase stone (${purchaseStnWt}) must be ≥ Sales stone (${salesStnWt})`,
            type: "error", duration: 3000,
          });
        }

        if (purchaseStnWt >= salesStnWt) {
          const stnDiff = Number(purchaseStnWt -salesStnWt).toFixed(3);
          if (Number(stnDiff) > Number(stnTolerance)) {
            hasError = true;
            toaster.create({
              title: `Row ${n} Stone Weight Error`,
              description: `Row ${n}: Sales stone Wt(${salesStnWt}) must be < stone tolerance (${stnTolerance})`,
              type: "error", duration: 3000,
            });
          }
        }
      });

      if (hasError) return false;

      // ✅ Limit checks
      const rowsForLimitCheck = countOnlyNew
        ? allRows.filter((r) => ("isNew" in r ? r.isNew : true))
        : allRows;

      const totalPCS = rowsForLimitCheck.length;
      const totalGrsWt = rowsForLimitCheck.reduce((s, r) => s + (r.grsweight || 0), 0);
      const totalPurchaseStoneWt = rowsForLimitCheck.reduce((s, r) => s + (r.purchaseStoneWt || 0), 0);

      // PCS limit
      if (limits.PCS && totalPCS > limits.PCS) {
        toaster.create({
          title: "Lot PCS Exceeded",
          description: `${totalPCS} pieces exceed the allowed ${limits.PCS}`,
          type: "error", duration: 2000,
        });
        return false;
      }

      // ✅ When balance PCS = 0 → check BOTH GrsWt and StnWt with tolerance
      if (balance && balance.PCS === 0) {

        // GrsWt ± tolerance
        if (limits.GRSWT && (totalGrsWt < grsLowerLimit || totalGrsWt > grsUpperLimit)) {
          toaster.create({
            title: "Lot GrsWt Out of Range",
            description:
              `Total GrsWt ${formatToFixed(totalGrsWt, 3)} is outside allowed range ` +
              `${formatToFixed(grsLowerLimit, 3)} – ${formatToFixed(grsUpperLimit, 3)} ` +
              `(limit ${formatToFixed(limits.GRSWT, 3)} ± ${formatToFixed(absTolerance, 3)})`,
            type: "error", duration: 3000,
          });
          return false;
        }

        // ✅ StnWt ± tolerance (now active, not commented out)
        // if (limits.STNWT && (totalPurchaseStoneWt < stnLowerLimit || totalPurchaseStoneWt > stnUpperLimit)) {
        //   toaster.create({
        //     title: "Lot Stone Weight Out of Range",
        //     description:
        //       `Total Purchase Stone Wt ${formatToFixed(totalPurchaseStoneWt, 3)} is outside allowed range ` +
        //       `${formatToFixed(stnLowerLimit, 3)} – ${formatToFixed(stnUpperLimit, 3)} ` +
        //       `(limit ${formatToFixed(limits.STNWT, 3)} ± ${formatToFixed(absStnTolerance, 3)})`,
        //     type: "error", duration: 3000,
        //   });
        //   return false;
        // }
      }

      // Balance consistency checks
      if (balance && balance.PCS > 0 && balance.GRSWT === 0) {
        toaster.create({
          title: "Invalid Entry",
          description: "Gross weight cannot be 0 when pieces are present",
          type: "error", duration: 2000,
        });
        return false;
      }

      if (balance && balance.STNWT > 0 && balance.PCS === 0) {
        toaster.create({
          title: "Invalid Entry",
          description: "PCS cannot be 0 when Stone Weight is present",
          type: "error", duration: 2000,
        });
        return false;
      }

      if (balance && balance.PCS === 0 && balance.GRSWT === 0 && balance.STNWT > 0) {
        toaster.create({
          title: "Invalid Entry",
          description: "Stone Weight must be 0 when both PCS and Gross Weight are 0",
          type: "error", duration: 2000,
        });
        return false;
      }

      return true;
    },
    []
  );

  return { validateHeader, validateHeaderWithToast, validateSingleRow, validateRows };
}