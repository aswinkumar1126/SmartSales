export const loadSalesClosing = (closing: any, setClosingDetails: any) => {
    if (!closing) return;

    console.log(closing, "closingclosing");
    setClosingDetails({
        CONVTYPE: closing.CONVTYPE || "",
        CONVAMT:  closing.CONVAMT ? String(closing.CONVAMT) : "",
        CONVWT:   closing.CONVWT ? String(closing.CONVWT) : "",
        CASHPAID: closing.CASHPAID ? String(closing.CASHPAID) : "",
        CASHRCVD: closing.CASHRCVD ? String(closing.CASHRCVD) : "",
        BANKPAID: closing.BANKPAID ? String(closing.BANKPAID) : "",
        BANKRCVD: closing.BANKRCVD ? String(closing.BANKRCVD) : "",
        BANKPAIDDETAILS: closing.BANKPAIDDETAILS || [],
        BANKRCVDDETAILS: closing.BANKRCVDDETAILS || [],
    });
};