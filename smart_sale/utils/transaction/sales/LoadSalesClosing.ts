export const loadSalesClosing = (closing: any, setClosingDetails: any) => {
    if (!closing) return;

    console.log(closing, "closingclosing");
    setClosingDetails({
        convType: closing.CONVTYPE || "",
        convAmt: closing.CONVAMT ? String(closing.CONVAMT) : "",
        convWt: closing.CONVWT ? String(closing.CONVWT) : "",
        cashPaid: closing.CASHPAID ? String(closing.CASHPAID) : "",
        cashRcvd: closing.CASHRCVD ? String(closing.CASHRCVD) : "",
        bankPaid: closing.BANKPAID ? String(closing.BANKPAID) : "",
        bankRcvd: closing.BANKRCVD ? String(closing.BANKRCVD) : "",
        bankPaidDetails: closing.bankPaidDetails || [],
        bankRcvdDetails: closing.bankRcvdDetails || [],
    });
};