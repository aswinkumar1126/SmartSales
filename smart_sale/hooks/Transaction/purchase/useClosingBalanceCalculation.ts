import { useMemo } from "react";
import { PurchaseClosingFormDetails, OpeningBalances, ClosingCalculationResult } from "@/types/balanceSummary/BalanceSummary";

export const useClosingCalculation = (
    closingDetails: PurchaseClosingFormDetails,
    openingBalances: OpeningBalances,
    rate: number
): ClosingCalculationResult => {
    return useMemo(() => {
        const cashRcvd = Number(closingDetails.cashRcvd || 0);
        const cashPaid = Number(closingDetails.cashPaid || 0);

        const bankRcvd = closingDetails.bankRcvdDetails.reduce(
            (sum, t) => sum + (t.amount || 0),
            0
        );

        const bankPaid = closingDetails.bankPaidDetails.reduce(
            (sum, t) => sum + (t.amount || 0),
            0
        );

        let convAmt = Number(closingDetails.convAmt || 0);
        let convWt = Number(closingDetails.convWt || 0);

        const type = closingDetails.convType;

        let closingCash =
            (openingBalances.openCash || 0) +
            cashRcvd +
            bankRcvd -
            cashPaid -
            bankPaid;

        let closingPure = openingBalances.openPure || 0;

        if (type === "C") {
            closingCash -= convAmt;
            closingPure += convWt;
        }

        if (type === "P") {
            closingCash += convAmt;
            closingPure -= convWt;
        }

        return {
            closingCash: Number(closingCash.toFixed(2)),
            closingPure: Number(closingPure.toFixed(3)),
        };
    }, [closingDetails, openingBalances, rate]);
};