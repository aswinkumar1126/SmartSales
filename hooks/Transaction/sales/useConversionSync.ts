import { useEffect } from "react";
import { useSalesBalanceSummary } from "@/store/sales/useSalesBalanceSummaryStore";

export const useClosingCalculations = (rate: number, stnRate: number , mc:number) => {
    const { closingDetails, setClosingField } = useSalesBalanceSummary();

    useEffect(() => {
         const {
            CONVTYPE,
            CONVAMT,
            CONVWT,
            STNGSTPER,
            MCGSTPER,
        } = closingDetails;


        let convAmt = parseFloat(closingDetails.CONVAMT || "") || 0;
        let convWt = parseFloat(closingDetails.CONVWT || "") || 0;


        console.log(convWt, convAmt, 'conversions')

        if (!rate || rate <= 0) return;


        // 🔴 CLEAR LOGIC (empty or invalid)
        if (CONVTYPE === "P") {
            // If weight is empty OR <= 0 → clear amount
            if (!CONVWT) {
                if (CONVAMT !== "") {
                    setClosingField("CONVAMT", "");
                }
                return;
            }
        }

        if (CONVTYPE === "C") {
            // If amount is empty OR <= 0 → clear weight
            if (!CONVAMT) {
                if (CONVWT !== "") {
                    setClosingField("CONVWT", "");
                }
                return;
            }
        }


        // 🟢 CALCULATION LOGIC
        if (CONVTYPE === "P") {
            const calculatedAmt = (convWt * rate).toFixed(2);

            if (calculatedAmt !== closingDetails.CONVAMT) {
                setClosingField("CONVAMT", calculatedAmt);
            }
        }

        if (CONVTYPE === "C") {
            const calculatedWt = (convAmt / rate).toFixed(3);

            if (calculatedWt !== closingDetails.CONVWT) {
                setClosingField("CONVWT", calculatedWt);
            }
        }

        // =========================
        // Stone GST Calculation
        // =========================

        const stnGstPer = Number(STNGSTPER) || 0;

        if (stnRate > 0 && stnGstPer > 0) {
            const stnGstAmt = ((stnGstPer * stnRate) / 100).toFixed(2);

            if (stnGstAmt !== closingDetails.STNGSTAMT) {
                setClosingField("STNGSTAMT", stnGstAmt);
            }
        }
        else{
            setClosingField("STNGSTAMT", '0.00');
        }

        // =========================
        // MC GST Calculation
        // =========================

        const mcGstPer = Number(MCGSTPER) || 0;

        if (mc > 0 && mcGstPer > 0) {
            const mcGstAmt = ((mcGstPer * mc) / 100).toFixed(2);

            if (mcGstAmt !== closingDetails.MCGSTAMT) {
                setClosingField("MCGSTAMT", mcGstAmt);
            }
        }
        else {
            setClosingField("MCGSTAMT", '0.00');
        }
    }, [
        closingDetails.CONVTYPE,
        closingDetails.CONVAMT,
        closingDetails.CONVWT,
        closingDetails.MCGSTPER,
        closingDetails.STNGSTPER,
        rate,
        stnRate,
        mc
    ]);
};

