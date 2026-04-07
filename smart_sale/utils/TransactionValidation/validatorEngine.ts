


export const validateSales = (row: any, ctx: any) => {
    const { isTagedItem } = ctx;

    if (!row.ITEMID) {
        return "Please select an item";
    }

    const isTagged = isTagedItem(Number(row.ITEMID));

    if (isTagged && !row.TAGNO) {
        return "TAG NO required for tagged item";
    }

    if (Number(row.GRSWT) <= 0) {
        return "Gross weight must be > 0";
    }

    if (Number(row.TOUCH) <= 0) {
        return "TOUCH must be > 0";
    }

    return null;
};

export const validateSalesReturn = (row: any) => {
    if (!row.TAGNO && !row.BILLNO) {
        return "Provide TAG NO or BILL NO";
    }
    return null;
};

export const validateIssue = (row: any) => {
    if (!row.PUREID || row.WT == null || row.TOUCH == null) {
        return "PUREID, WT, TOUCH required";
    }
    return null;
};

export const validateReceipt = validateIssue;




export const VALIDATORS: Record<string, Function> = {
    sales: validateSales,
    sales_return: validateSalesReturn,
    issue: validateIssue,
    receipt: validateReceipt,
};