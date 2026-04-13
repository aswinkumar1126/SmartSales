import { useSalesHeader } from "@/store/sales/useSalesHeader";
import { useSalesBalanceSummary } from "@/store/sales/useSalesBalanceSummaryStore";

import { loadSalesHeader  } from "@/utils/transaction/sales/LoadSalesHeader";
import { loadSalesClosing } from "@/utils/transaction/sales/LoadSalesClosing";
import { mapSalesTransactionItems } from "@/utils/transaction/sales/MapSalesTransactionItems";

export const useLoadSalesTransaction = () => {
    const { setHeaderForm, setAccCode, startEdit } = useSalesHeader();
    const { setClosingDetails } = useSalesBalanceSummary(); 
    // const { setBaseOpening } = useOpeningBalanceStore(); 

    const loadTransaction = (transactionData: any, sno: string ,isTagedItem:(id: number | null) => boolean ) => {
        if (!transactionData) return;

        startEdit(sno);

        loadSalesHeader(transactionData.TRANSACTION_HEADER , setHeaderForm, setAccCode);
        loadSalesClosing(transactionData.CLOSING_DETAILS, setClosingDetails);

        // loadOpening(transactionData.BALANCE, setBaseOpening);

        const { rows,selectedTransactionTypes } = mapSalesTransactionItems(transactionData, isTagedItem );

        return { rows,selectedTransactionTypes };
    };

    return { loadTransaction };
};