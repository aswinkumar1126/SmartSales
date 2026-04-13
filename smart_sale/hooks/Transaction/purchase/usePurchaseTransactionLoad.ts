import { usePurchaseHeader } from "@/store/purchase/usePurchaseHeader";
import { usePurchaseBalanceSummary } from "@/store/purchase/useBalanceSummaryStore";

import { loadPurchaseHeader  } from "@/utils/transaction/purchase/LoadPurchaseHeader";
import { loadPurchaseClosing } from "@/utils/transaction/purchase/LoadPurchaseClosing";
import { mapPurchaseTransactionItems } from "@/utils/transaction/purchase/MapPurchaseTransactionItems";

export const useLoadPurchaseTransaction = () => {
    const { setHeaderForm, setAccCode, startEdit } = usePurchaseHeader();
    const { setClosingDetails } = usePurchaseBalanceSummary(); 
    // const { setBaseOpening } = useOpeningBalanceStore(); 

    const loadTransaction = (transactionData: any, sno: string ,isTagedItem:(id: number | null) => boolean ) => {
        if (!transactionData) return;

        startEdit(sno);

        loadPurchaseHeader(transactionData.TRANSACTION_HEADER , setHeaderForm, setAccCode);
        loadPurchaseClosing(transactionData.CLOSING_DETAILS, setClosingDetails);

        // loadOpening(transactionData.BALANCE, setBaseOpening);

        const { rows, selectedTransactionTypes } = mapPurchaseTransactionItems(transactionData, isTagedItem );

        return { rows,selectedTransactionTypes };
    };

    return { loadTransaction };
};