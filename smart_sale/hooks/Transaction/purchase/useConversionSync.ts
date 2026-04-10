import { useEffect } from "react";
import { usePurchaseBalanceSummary } from "@/store/purchase/useBalanceSummaryStore";

export const useConversionSync = (rate: number) => {
    const { closingDetails, setClosingField } = usePurchaseBalanceSummary();

    useEffect(() => {
        const convType = closingDetails.convType;

        const convAmtStr = closingDetails.convAmt;
        const convWtStr = closingDetails.convWt;


        let convAmt = parseFloat(closingDetails.convAmt || "") || 0;
        let convWt = parseFloat(closingDetails.convWt || "") || 0;
        

        console.log(convWt ,convAmt ,'conversions')

        if (!rate || rate <=0) return;


        // 🔴 CLEAR LOGIC (empty or invalid)
        if (convType === "P") {
            // If weight is empty OR <= 0 → clear amount
            if (!convWtStr || convWt <= 0) {
                if (convAmtStr !== "") {
                    setClosingField("convAmt", "");
                }
                return;
            }
        }

        if (convType === "C") {
            // If amount is empty OR <= 0 → clear weight
            if (!convAmtStr || convAmt <= 0) {
                if (convWtStr !== "") {
                    setClosingField("convWt", "");
                }
                return;
            }
        }


        // 🟢 CALCULATION LOGIC
        if (convType === "P" && convWt > 0) {
            const calculatedAmt = (convWt * rate).toFixed(2);

            if (calculatedAmt !== closingDetails.convAmt) {
                setClosingField("convAmt", calculatedAmt);
            }
        }

        if (convType === "C" && convAmt > 0) {
            const calculatedWt = (convAmt / rate).toFixed(3);

            if (calculatedWt !== closingDetails.convWt) {
                setClosingField("convWt", calculatedWt);
            }
        }

    }, [
        closingDetails.convType,
        closingDetails.convAmt,
        closingDetails.convWt,
        rate,
    ]);
};