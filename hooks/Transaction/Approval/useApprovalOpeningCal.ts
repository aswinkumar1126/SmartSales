import { useMemo } from "react";
import { APPROVAL_TRANSACTION_KEY_MAP } from "@/types/transcation/ApprovalTransaction";

type TransactionRow = {
    TRANSACTION_TYPE: string;
    PUREWT?: number;
    HMC?: number;
    STNAMT?: number;
    MC?: number;
    PCS?:number;
    GRSWT?:number;
}

type OpeningBalances = {
    openPcs: number;
    openGrsWt: number;
};

export const useApprovalOpeningBalances = (
    draftRows: TransactionRow[],
    initialPcs: number,
    initialGrsWt: number
): OpeningBalances => {
    return useMemo(() => {
        let openPcs = initialPcs;
        let openGrsWt = initialGrsWt;



        draftRows.forEach((row) => {
            const type = APPROVAL_TRANSACTION_KEY_MAP[row.TRANSACTION_TYPE];

        
            const pcs = Number(row.PCS) || 0;
            const grsWt =Number(row.GRSWT)|| 0;


            switch (type) {
                case "APPROVAL_ISSUE":
                    openGrsWt += grsWt;
                    openPcs += pcs;
                    break;

                case "APPROVAL_RECEIPT":
                    openGrsWt -= grsWt;
                    openPcs -= pcs;
                    break;
            }
        });

        return {
            openPcs: Number(openPcs),
            openGrsWt: Number(openGrsWt),
        };
    }, [draftRows, initialPcs, initialGrsWt]);
};