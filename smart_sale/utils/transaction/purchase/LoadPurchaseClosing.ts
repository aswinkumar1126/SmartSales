export const loadPurchaseClosing = (
    closing: any,
    setClosingDetails: any,
    setBankPaid: any,
    setBankRcvd: any
) => {
    if (!closing) return;

    const bankPaidDetails = (closing.BANKPAIDDETAILS || []).map((item: any) => ({
        ...item,
        BANKID: item.BANKID ? String(item.BANKID) : ""
    }));

    const bankRcvdDetails = (closing.BANKRCVDDETAILS || []).map((item: any) => ({
        ...item,
        BANKID: item.BANKID ? String(item.BANKID) : ""
    }));

    setClosingDetails({
        CONVTYPE: closing.CONVTYPE || "",
        CONVAMT: closing.CONVAMT ? String(closing.CONVAMT) : "",
        CONVWT: closing.CONVWT ? String(closing.CONVWT) : "",
        CASHPAID: closing.CASHPAID ? String(closing.CASHPAID) : "",
        CASHRCVD: closing.CASHRCVD ? String(closing.CASHRCVD) : "",
        BANKPAID: closing.BANKPAID ? String(closing.BANKPAID) : "",
        BANKRCVD: closing.BANKRCVD ? String(closing.BANKRCVD) : "",
        BANKPAIDDETAILS: bankPaidDetails,
        BANKRCVDDETAILS: bankRcvdDetails,
    });

    setBankPaid(bankPaidDetails);
    setBankRcvd(bankRcvdDetails);
};