import { useEffect } from "react";
import { useApprovalHeader } from "@/store/approval/useApprovalHeader";
import { formatToFixed } from "@/utils/format/numberFormat";

type TransactionHeaderDetail = {
    ENTRYNO?: number;
    BILLNO?: number;
};

type metalRatesDetail = {
    "GOLD 916.00"?: number;
};

export const useSyncApprovalHeader = (
    transactionHeaderDetail?: TransactionHeaderDetail,
    isApiRateEnabled ? :boolean ,
    metalRates?: metalRatesDetail
) => {
    const { headerForm, setHeaderForm, isEditing } = useApprovalHeader();

    // 🔵 Metal rate sync
    useEffect(() => {
        if (isEditing || !metalRates || !isApiRateEnabled) return;

        if(headerForm.RATEGM && Number(headerForm.RATEGM) > 0){
            return;
        }

        setHeaderForm({
            RATEGM: formatToFixed(metalRates["GOLD 916.00"],2) ?? 0,
        });
    }, [metalRates, isEditing, setHeaderForm ,isApiRateEnabled]);

    // 🔵 Entry + Bill sync
    useEffect(() => {
        if (isEditing || !transactionHeaderDetail) return;

        setHeaderForm({
            ENTRYNO: transactionHeaderDetail.ENTRYNO
                ? String(transactionHeaderDetail.ENTRYNO)
                : "",

           
        });
    }, [transactionHeaderDetail, isEditing, setHeaderForm]);
};