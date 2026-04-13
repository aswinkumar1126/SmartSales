import { useEffect } from "react";
import { usePurchaseHeader } from "@/store/purchase/usePurchaseHeader";
import { formatToFixed } from "@/utils/format/numberFormat";

type TransactionHeaderDetail = {
    ENTRYNO?: number;
    BILLNO?: number;
};

type metalRatesDetail = {
    "GOLD 916.00"?: number;
};

export const useSyncPurchaseHeader = (
    transactionHeaderDetail?: TransactionHeaderDetail,
    metalRates?: metalRatesDetail
) => {
    const { setHeaderForm, isEditing } = usePurchaseHeader();

    // 🔵 Metal rate sync
    useEffect(() => {
        if (isEditing || !metalRates) return;

        setHeaderForm({
            RATEGM: formatToFixed(metalRates["GOLD 916.00"],2) ?? 0,
        });
    }, [metalRates, isEditing, setHeaderForm]);

    // 🔵 Entry + Bill sync
    useEffect(() => {
        if (isEditing || !transactionHeaderDetail) return;

        setHeaderForm({
            ENTRYNO: transactionHeaderDetail.ENTRYNO
                ? String(transactionHeaderDetail.ENTRYNO)
                : "",

            BILLNO: transactionHeaderDetail.BILLNO
                ? String(transactionHeaderDetail.BILLNO)
                : "",
        });
    }, [transactionHeaderDetail, isEditing, setHeaderForm]);
};