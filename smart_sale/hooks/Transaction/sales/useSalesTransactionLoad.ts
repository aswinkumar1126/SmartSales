import { useSalesHeader } from "@/store/sales/useSalesHeader";
import { useSalesBalanceSummary } from "@/store/sales/useSalesBalanceSummaryStore";

import { loadSalesHeader } from "@/utils/transaction/sales/LoadSalesHeader";
import { loadSalesClosing } from "@/utils/transaction/sales/LoadSalesClosing";
import { mapSalesTransactionItems } from "@/utils/transaction/sales/MapSalesTransactionItems";
import { useSoftControlById } from "@/hooks/apiHooks/softControl/useSoftControl";

export const useLoadSalesTransaction = () => {
    const { setHeaderForm, setAccCode, startEdit } = useSalesHeader();
    const { setClosingDetails } = useSalesBalanceSummary();
    // const { setBaseOpening } = useOpeningBalanceStore();

    // ✅ Hook called here — allowed inside custom hooks
    const { data: controlData } = useSoftControlById('SA_HMC_FINALAMT');

    console.log(controlData, 'controlData')
    const isUseFinalAmount = controlData?.CTLTEXT === "Y";

    const loadTransaction = (transactionData: any, sno: string) => {
        if (!transactionData) return;

        startEdit(sno);

        loadSalesHeader(transactionData.TRANSACTION_HEADER, setHeaderForm, setAccCode);
        loadSalesClosing(transactionData.CLOSING_DETAILS, setClosingDetails);

        // loadOpening(transactionData.BALANCE, setBaseOpening);

        const { rows, selectedTransactionTypes } = mapSalesTransactionItems(transactionData, isUseFinalAmount);

        return { rows, selectedTransactionTypes };
    };

    return { loadTransaction };
};