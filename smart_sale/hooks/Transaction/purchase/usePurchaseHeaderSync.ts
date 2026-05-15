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
    isApiRateEnabled?: boolean ,
    metalRates?: MetalRates,
    metalType?: string
) => {
    const { headerForm ,setHeaderForm, isEditing } = usePurchaseHeader();

  useEffect(() => {
    if (isEditing) return;
    if (!isApiRateEnabled) return;
    if (!metalRates || !metalType) return;

    const rateKey =
        metalType === "G"
            ? "GOLD 916.00"
            : metalType === "S"
            ? "SILVER 916.00"
            : null;

    if (!rateKey) return;

    const apiRate = metalRates[rateKey];

    if (apiRate == null) return;

    const formattedRate = formatToFixed(apiRate, 2);

    // prevent unnecessary updates
   if(headerForm.RATEGM && Number(headerForm.RATEGM) > 0){
            return;
        }
    setHeaderForm({
        RATEGM: formattedRate,
    });
}, [
    metalRates,
    metalType,
    isEditing,
    isApiRateEnabled,
]);

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