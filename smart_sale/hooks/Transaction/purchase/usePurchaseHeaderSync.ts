import { useEffect } from "react";
import { usePurchaseHeader } from "@/store/purchase/usePurchaseHeader";
import { formatToFixed } from "@/utils/format/numberFormat";

type TransactionHeaderDetail = {
    ENTRYNO?: number;
    BILLNO?: number;
};

type MetalRates = {
    "GOLD 916.00"?: number;
    "SILVER 916.00"?: number;
};

export const useSyncPurchaseHeader = (
    transactionHeaderDetail?: TransactionHeaderDetail,
    metalRates?: MetalRates,
    metalType?: string
) => {
    const { setHeaderForm, isEditing } = usePurchaseHeader();

    // 🔵 Metal rate sync
    useEffect(() => {
        if (isEditing || !metalRates || !metalType) return;

        const rateKey =
            metalType === "G"
                ? "GOLD 916.00"
                : metalType === "S"
                    ? "SILVER 916.00"
                    : null;

        const rateValue = rateKey ? metalRates[rateKey] : null;

        setHeaderForm({
            RATEGM:
                rateValue != null
                    ? Number(formatToFixed(rateValue, 2))
                    : 0,
        });
    }, [metalRates, metalType, isEditing, setHeaderForm]);

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