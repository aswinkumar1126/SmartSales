import { useApprovalHeader } from "@/store/approval/useApprovalHeader";
// import { useSalesBalanceSummary } from "@/store/sales/useSalesBalanceSummaryStore";

import { loadApprovalHeader } from "@/utils/transaction/approval/LoadApprovalHeader";
// import { loadSalesClosing } from "@/utils/transaction/sales/LoadSalesClosing";
import { mapSalesTransactionItems } from "@/utils/transaction/approval/MapApprovalTransactionItems";
import { useSoftControlById } from "@/hooks/apiHooks/softControl/useSoftControl";

export const useLoadApprovalTransaction = () => {
    const { setHeaderForm, setAccCode, startEdit } = useApprovalHeader();
    // const { setClosingDetails } = useSalesBalanceSummary();
    // const { setBaseOpening } = useOpeningBalanceStore();

    // ✅ Hook called here — allowed inside custom hooks
    const { data: controlData } = useSoftControlById('SA_HMC_FINALAMT');

    console.log(controlData, 'controlData')
    const isUseFinalAmount = controlData?.CTLTEXT === "Y";

    const loadTransaction = (transactionData: any, sno: string) => {
        if (!transactionData) return;

        startEdit(sno);

        loadApprovalHeader(transactionData.TRANSACTION_HEADER, setHeaderForm, setAccCode);
        // loadSalesClosing(transactionData.CLOSING_DETAILS, setClosingDetails);

        // loadOpening(transactionData.BALANCE, setBaseOpening);

        const { rows, selectedTransactionTypes } = mapSalesTransactionItems(transactionData, isUseFinalAmount);

        return { rows, selectedTransactionTypes };
    };

    return { loadTransaction };
};