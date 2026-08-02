import { useEffect } from "react";
import { usePurchaseBalanceSummary } from "@/store/purchase/useBalanceSummaryStore";

export const useClosingCalculations = (
    rate: number,
    stnRate: number,
    mc: number
) => {
    const { closingDetails, setClosingField } = usePurchaseBalanceSummary();

    useEffect(() => {
        const {
            CONVTYPE,
            CONVAMT,
            CONVWT,
            STNGSTPER,
            MCGSTPER,
        } = closingDetails;

        // =========================
        // Conversion Calculation
        // =========================

        const convAmt = parseFloat(CONVAMT || "") || 0;
        const convWt = parseFloat(CONVWT || "") || 0;

        if (rate > 0) {
            if (CONVTYPE === "P") {
                if (!CONVWT) {
                    if (CONVAMT !== "") {
                        setClosingField("CONVAMT", "");
                    }
                } else {
                    const calculatedAmt = (convWt * rate).toFixed(2);

                    if (calculatedAmt !== CONVAMT) {
                        setClosingField("CONVAMT", calculatedAmt);
                    }
                }
            }

            if (CONVTYPE === "C") {
                if (!CONVAMT) {
                    if (CONVWT !== "") {
                        setClosingField("CONVWT", "");
                    }
                } else {
                    const calculatedWt = (convAmt / rate).toFixed(3);

                    if (calculatedWt !== CONVWT) {
                        setClosingField("CONVWT", calculatedWt);
                    }
                }
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
            setClosingField("STNGSTAMT", "0.00");
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
            setClosingField("MCGSTAMT", "0.00");
        }
    }, [
        rate,
        stnRate,
        mc,
        closingDetails.CONVTYPE,
        closingDetails.CONVAMT,
        closingDetails.CONVWT,
        closingDetails.STNGSTPER,
        closingDetails.MCGSTPER,
        closingDetails.STNGSTAMT,
        closingDetails.MCGSTAMT,
        setClosingField,
    ]);
};