import { useEffect } from "react";
import { usePurchaseBalanceSummary } from "@/store/purchase/useBalanceSummaryStore";

export const useConversionSync = (rate: number) => {
    const { closingDetails, setClosingField } = usePurchaseBalanceSummary();

    useEffect(() => {
        const convType = closingDetails.CONVTYPE;

        const convAmtStr = closingDetails.CONVAMT;
        const convWtStr = closingDetails.CONVWT;


        let convAmt = parseFloat(closingDetails.CONVAMT || "") || 0;
        let convWt = parseFloat(closingDetails.CONVWT || "") || 0;
        

        console.log(convWt ,convAmt ,'conversions')

        if (!rate || rate <=0) return;


        // 🔴 CLEAR LOGIC (empty or invalid)
        if (convType === "P") {
            // If weight is empty OR <= 0 → clear amount
            if (!convWtStr || convWt <= 0) {
                if (convAmtStr !== "") {
                    setClosingField("CONVAMT", "");
                }
                return;
            }
        }

        if (convType === "C") {
            // If amount is empty OR <= 0 → clear weight
            if (!convAmtStr || convAmt <= 0) {
                if (convWtStr !== "") {
                    setClosingField("CONVWT", "");
                }
                return;
            }
        }


        // 🟢 CALCULATION LOGIC
        if (convType === "P" && convWt > 0) {
            const calculatedAmt = (convWt * rate).toFixed(2);

            if (calculatedAmt !== closingDetails.CONVAMT) {
                setClosingField("CONVAMT", calculatedAmt);
            }
        }

        if (convType === "C" && convAmt > 0) {
            const calculatedWt = (convAmt / rate).toFixed(3);

            if (calculatedWt !== closingDetails.CONVWT) {
                setClosingField("CONVWT", calculatedWt);
            }
        }

    }, [
        closingDetails.CONVTYPE,
        closingDetails.CONVAMT,
        closingDetails.CONVWT,
        rate,
    ]);
};