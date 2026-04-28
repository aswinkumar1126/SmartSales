export const loadSalesClosing = (
    closing: any,
    setClosingDetails: any
) => {
    if (!closing) return;

    console.log(closing, "closingclosing");

    const bankPaidDetails = (closing.BANKPAIDDETAILS || []).map((item: any) => ({
        ...item,
        BANKID: item.BANKID != null ? String(item.BANKID) : ""
    }));

    const bankRcvdDetails = (closing.BANKRCVDDETAILS || []).map((item: any) => ({
        ...item,
        BANKID: item.BANKID != null ? String(item.BANKID) : ""
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
};