import { usePurchaseHeader } from "@/store/purchase/usePurchaseHeader";
import { usePurchaseBalanceSummary } from "@/store/purchase/useBalanceSummaryStore";

import { loadPurchaseHeader } from "@/utils/transaction/purchase/LoadPurchaseHeader";
import { loadPurchaseClosing } from "@/utils/transaction/purchase/LoadPurchaseClosing";
import { mapPurchaseTransactionItems } from "@/utils/transaction/purchase/MapPurchaseTransactionItems";
import { useSoftControlById } from "@/hooks/apiHooks/softControl/useSoftControl";

export const useLoadPurchaseTransaction = () => {
    const { setHeaderForm, setAccCode, startEdit } = usePurchaseHeader();
    const { setClosingDetails, setBankPaid, setBankRcvd } = usePurchaseBalanceSummary();

    // ✅ Hook called here — allowed inside custom hooks
    const { data: controlData } = useSoftControlById('PU_HMC_FINALAMT');

    console.log(controlData,'controlData')
    const isUseFinalAmount = controlData?.CTLTEXT === "Y";

    const loadTransaction = (
        transactionData: any,
        sno: string,
        isTagedItem: (id: number | null) => boolean
    ) => {
        if (!transactionData) return;

        startEdit(sno);

        loadPurchaseHeader(transactionData.TRANSACTION_HEADER, setHeaderForm, setAccCode);
        loadPurchaseClosing(transactionData.CLOSING_DETAILS, setClosingDetails, setBankPaid, setBankRcvd);

        // ✅ Pass flag into pure function
        const { rows, selectedTransactionTypes } = mapPurchaseTransactionItems(
            transactionData,
            isTagedItem,
            isUseFinalAmount
        );

        return { rows, selectedTransactionTypes };
    };

    return { loadTransaction };
};