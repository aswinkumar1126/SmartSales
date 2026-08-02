import { useMemo } from "react";
import { SALE_TRANSACTION_KEY_MAP } from "@/types/transcation/SaleTransaction";

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

export const useSalesOpeningBalances = (
    draftRows: TransactionRow[],
    initialPure: number,
    initialCash: number
): OpeningBalances => {
    return useMemo(() => {
        let openPure = initialPure;
        let openCash = initialCash;

  

        draftRows.forEach((row) => {
            const type = SALE_TRANSACTION_KEY_MAP[row.TRANSACTION_TYPE];

            const pureWt = Number(row.PUREWT) || 0;

            const cash =
                (Number(row.HMC) || 0) +
                (Number(row.STNAMT) || 0) +
                (Number(row.MC) || 0);

            switch (type) {
                case "sales":
                    openPure -= pureWt;
                    openCash -= cash;
                    break;

                case "sales_return":
                    openPure += pureWt;
                    openCash += cash;
                    break;

                case "receipt":
                    openPure += pureWt;
                    break;

                case "issue":
                    openPure -= pureWt;
                    break;
            }
        });

        return {
            openPure: Number(openPure.toFixed(3)),
            openCash: Number(openCash.toFixed(2)),
        };
    }, [draftRows, initialPure, initialCash]);
};