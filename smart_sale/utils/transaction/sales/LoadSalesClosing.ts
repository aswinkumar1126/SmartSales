export const loadSalesClosing = (
    closing: any,
    setClosingDetails: any
) => {
    if (!closing) return;

    console.log(closing, "closingclosing");

    const bankPaidDetails = (closing.BANKPAIDDETAILS || []).map((item: any) => ({
        ...item,
        ID:`bank-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        BANKID: item.BANKID != null ? String(item.BANKID) : "",
        SNO: item.SNO,
    }));

    const bankRcvdDetails = (closing.BANKRCVDDETAILS || []).map((item: any) => ({
        ...item,
        BANKID: item.BANKID != null ? String(item.BANKID) : "",
        SNO: item.SNO,
    }));

    setClosingDetails({
        CONVTYPE: closing.CONVTYPE || "",
        CONVAMT: closing.CONVAMT ? String(closing.CONVAMT) : "",
        CONVWT: closing.CONVWT ? String(closing.CONVWT) : "",
        DISCWT : closing.DISCWT ? String(closing.DISCWT) : "",
        DISCAMT: closing.DISCAMT ? String(closing.DISCAMT) : "",
        CASHPAID: closing.CASHPAID ? String(closing.CASHPAID) : "",
        CASHRCVD: closing.CASHRCVD ? String(closing.CASHRCVD) : "",
        BANKPAID: closing.BANKPAID ? String(closing.BANKPAID) : "",
        BANKRCVD: closing.BANKRCVD ? String(closing.BANKRCVD) : "",

        STNGSTPER: closing.STNGSTPER ? String(closing.STNGSTPER) : "",
        STNGSTAMT: closing.STNGSTAMT ? String(closing.STNGSTAMT) : "",

        MCGSTPER :closing.MCGSTPER ? String(closing.MCGSTPER) : "",
        MCGSTAMT: closing.MCGSTAMT ? String(closing.MCGSTAMT) : "",

        TDSPER: closing.TDSPER ? String(closing.TDSPER) : "",
        TDSAMT: closing.TDSAMT ? String(closing.TDSAMT) : "",
        BANKPAIDDETAILS: bankPaidDetails,
        BANKRCVDDETAILS: bankRcvdDetails,
    });
};