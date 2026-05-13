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
const validateSingleRow = useCallback(
  (
    data: {
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
    tolerance: number = 0 
  ): Record<string, string> => {
    const errors: Record<string, string> = {};
    console.log(data ,'draftRow');

    const grs = Number(data.grsweight || 0);
    const purchaseStnWt = Number(data.purchaseStoneWt || 0);
    const salesStnWt = Number(data.salesStoneWt || 0);

    const grsUpperLimit = Number((balance.GRSWT + tolerance).toFixed(3));

    console.log(balance,grsUpperLimit,'grsUpperLimit');

    /* =========================
       GROSS WEIGHT VALIDATION
    ========================= */

    if (grs <= 0) {
      errors.grsweight = "Gross weight must be greater than 0";
    } else if (grs > grsUpperLimit) {
      errors.grsweight = `Gross weight cannot exceed balance gross weight (${grsUpperLimit}g)`;
    }

    /* =========================
       STONE VALIDATION
    ========================= */

  
      console.log(purchaseStnWt, salesStnWt, balance.STNWT, 'stone validation');
      // PURCHASE STONE WT
    if(hasStone) {
     if (purchaseStnWt > balance.STNWT) {
        errors.purchaseStoneWt =
          `Purchase stone weight cannot exceed balance stone weight (${balance.STNWT})`;
      }

      // SALES STONE WT

     if (salesStnWt > purchaseStnWt) {
        errors.stoneWt =
          "Sales stone weight cannot exceed purchase stone weight";
      } else if (salesStnWt > balance.STNWT) {
        errors.stoneWt =
          `Sales stone weight cannot exceed balance stone weight (${balance.STNWT})`;
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

      return true;
    },
    []
  );

  return { validateHeader, validateHeaderWithToast, validateSingleRow, validateRows };
}