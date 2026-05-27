export const loadPurchaseClosing = (
    closing: any,
    setClosingDetails: any,
    setBankPaid: any,
    setBankRcvd: any
) => {
    if (!closing) return;

    console.log(closing,'closingdetials');

    const bankPaidDetails = (closing.BANKPAIDDETAILS || []).map((item: any) => ({
        ...item,
        BANKID: item.BANKID ? String(item.BANKID) : "",
        SNO : item.SNO ,
    }));

    const bankRcvdDetails = (closing.BANKRCVDDETAILS || []).map((item: any) => ({
        ...item,
        BANKID: item.BANKID ? String(item.BANKID) : "",
        SNO: item.SNO 
    }));

    console.log(bankPaidDetails,bankRcvdDetails ,'bankPaidDetails');

    setClosingDetails({
        CONVTYPE: closing.CONVTYPE || "",
        CONVAMT: closing.CONVAMT ? String(closing.CONVAMT) : "",
        CONVWT: closing.CONVWT ? String(closing.CONVWT) : "",
        DISCWT: closing.DISCWT ? String(closing.DISCWT) : "",
        DISCAMT: closing.DISCAMT ? String(closing.DISCAMT) : "",
        CASHPAID: closing.CASHPAID ? String(closing.CASHPAID) : "",
        CASHRCVD: closing.CASHRCVD ? String(closing.CASHRCVD) : "",
        BANKPAID: closing.BANKPAID ? String(closing.BANKPAID) : "",
        BANKRCVD: closing.BANKRCVD ? String(closing.BANKRCVD) : "",
        GSTPER : closing.GSTPER ? String(closing.GSTPER) : "",
        GSTAMT: closing.GSTAMT ? String(closing.GSTAMT) : "",
        TDSPER: closing.TDSPER ? String(closing.TDSPER) : "",
        TDSAMT: closing.TDSAMT ? String(closing.TDSAMT) : "",
        BANKPAIDDETAILS: bankPaidDetails,
        BANKRCVDDETAILS: bankRcvdDetails,
    });

    setBankPaid(bankPaidDetails);
    setBankRcvd(bankRcvdDetails);
};