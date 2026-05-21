import { useEffect } from "react";
import { useSalesBalanceSummary } from "@/store/sales/useSalesBalanceSummaryStore";

export const useConversionSync = (rate: number) => {
    const { closingDetails, setClosingField } = useSalesBalanceSummary();

    useEffect(() => {
        const convType = closingDetails.CONVTYPE;

        const convAmtStr = closingDetails.CONVAMT;
        const convWtStr = closingDetails.CONVWT;


        let convAmt = parseFloat(closingDetails.CONVAMT || "") || 0;
        let convWt = parseFloat(closingDetails.CONVWT || "") || 0;


        console.log(convWt, convAmt, 'conversions')

        if (!rate || rate <= 0) return;


        // 🔴 CLEAR LOGIC (empty or invalid)
        if (convType === "P") {
            // If weight is empty OR <= 0 → clear amount
            if (!convWtStr) {
                if (convAmtStr !== "") {
                    setClosingField("CONVAMT", "");
                }
                return;
            }
        }

        if (convType === "C") {
            // If amount is empty OR <= 0 → clear weight
            if (!convAmtStr) {
                if (convWtStr !== "") {
                    setClosingField("CONVWT", "");
                }
                return;
            }
        }


        // 🟢 CALCULATION LOGIC
        if (convType === "P") {
            const calculatedAmt = (convWt * rate).toFixed(2);

            if (calculatedAmt !== closingDetails.CONVAMT) {
                setClosingField("CONVAMT", calculatedAmt);
            }
        }

        if (convType === "C") {
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

export const useGstConversion = (stnRate: number) => {
    const { closingDetails, setClosingField } = useSalesBalanceSummary();


    useEffect(() => {

        const gstPer = Number(closingDetails.GSTPER);

        const gstAmt = (gstPer * stnRate) / 100;

        if (stnRate < 0 && gstPer < 0) return;

        setClosingField("GSTAMT", gstAmt.toFixed(2))

    }, [
        closingDetails.GSTPER,
        stnRate,
    ]);


};