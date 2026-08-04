//SALESCLOSING

import { useMemo } from "react";
import { SalesClosingFormDetails, OpeningBalances, ClosingCalculationResult } from "@/types/balanceSummary/BalanceSummary";

export const useClosingCalculation = (
    closingDetails: SalesClosingFormDetails,
    openingBalances: OpeningBalances,
    rate: number
): ClosingCalculationResult => {
    return useMemo(() => {


        const cashRcvd = Number(closingDetails.CASHRCVD || 0);
        const cashPaid = Number(closingDetails.CASHPAID || 0);

        const discAmt = Number(closingDetails.DISCAMT || 0);
        const discWt = Number(closingDetails.DISCWT || 0);

        const stnGstAmt = Number(closingDetails.STNGSTAMT || 0);
        const mcGstAmt = Number(closingDetails.MCGSTAMT || 0);
        const tdsAmt = Number(closingDetails.TDSAMT || 0);

        const bankRcvd = closingDetails.BANKRCVDDETAILS.length > 0 ? closingDetails.BANKRCVDDETAILS.reduce(
            (sum, t) => sum + (t.AMOUNT || 0),
            0
        ) : 0;

        const bankPaid = closingDetails.BANKPAIDDETAILS.length > 0 ? closingDetails.BANKPAIDDETAILS.reduce(
            (sum, t) => sum + (t.AMOUNT || 0),
            0
        ) : 0;

        let convAmt = Number(closingDetails.CONVAMT || 0);
        let convWt = Number(closingDetails.CONVWT || 0);

        const type = closingDetails.CONVTYPE;

        let closingCash =
            (openingBalances.openCash || 0) -
            cashRcvd -
            bankRcvd +
            cashPaid +
            bankPaid +
            discAmt +
            stnGstAmt +
            mcGstAmt -
            tdsAmt;

        let closingPure = (openingBalances.openPure || 0) + discWt;

        if (type === "C") {
            closingCash += convAmt;
            closingPure -= convWt;
        }

        if (type === "P") {
            closingCash -= convAmt;
            closingPure += convWt;
        }

        return {
            closingCash: Number(closingCash.toFixed(2)),
            closingPure: Number(closingPure.toFixed(3)),
        };
    }, [closingDetails, openingBalances, rate]);
};