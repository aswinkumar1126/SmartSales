export const loadApprovalHeader = (header: any, setHeaderForm: any, setAccCode: any) => {
    if (!header) return;

    console.log(header,'headerheader')
    setHeaderForm({
        CUSTOMER: header.ACCODE ? String(header.ACCODE) : "",
        CUSTOMER_NAME: header.ACNAME || "",
        DATE: header.TRANDATE || "",
        BILLNO: header.BILLNO || "",
        ENTRYNO: header.ENTRYNO || "",
        RATEGM: header.RATE || header.RATEGM || "",
    });

    setAccCode(header.ACCODE);
};