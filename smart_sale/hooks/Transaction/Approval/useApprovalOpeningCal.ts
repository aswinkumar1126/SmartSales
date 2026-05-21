import { useMemo } from "react";
import { APPROVAL_TRANSACTION_KEY_MAP } from "@/types/transcation/ApprovalTransaction";

type TransactionRow = {
    TRANSACTION_TYPE: string;
    PUREWT?: number;
    HMC?: number;
    STNAMT?: number;
    MC?: number;
}

type OpeningBalances = {
    openPure: number;
    openCash: number;
};

export const useApprovalOpeningBalances = (
    draftRows: TransactionRow[],
    initialPure: number,
    initialCash: number
): OpeningBalances => {
    return useMemo(() => {
        let openPure = initialPure;
        let openCash = initialCash;



        draftRows.forEach((row) => {
            const type = APPROVAL_TRANSACTION_KEY_MAP[row.TRANSACTION_TYPE];

            const pureWt = Number(row.PUREWT) || 0;

            const cash =
                (Number(row.HMC) || 0) +
                (Number(row.STNAMT) || 0) +
                (Number(row.MC) || 0);

            switch (type) {
                case "APPROVAL_ISSUE":
                    openPure -= pureWt;
                    openCash -= cash;
                    break;

                case "APPROVAL_RECEIPT":
                    openPure += pureWt;
                    openCash += cash;
                    break;
            }
        });

        return {
            openPure: Number(openPure.toFixed(3)),
            openCash: Number(openCash.toFixed(2)),
        };
    }, [draftRows, initialPure, initialCash]);
};