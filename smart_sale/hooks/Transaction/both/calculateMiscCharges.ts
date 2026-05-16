export const calculateMiscChargeFinalAmount = ({
    chargeName,
    amount,
    pcs,
    isHmcFinalAmt,
}: {
    chargeName: string;
    amount: number;
    pcs: number;
    isHmcFinalAmt: boolean;
}) => {
    const isHmc =
        String(chargeName || "").trim().toUpperCase() === "HMC";

    if (isHmc && isHmcFinalAmt) {
        return amount * pcs;
    }

    return amount;
};