
export const validateSales = (row: any) => {

   

    if (!row.ITEMID) {
        return "Please select an item";
    }

    if (row.ITEM_TYPE === "TAGGED" && !row.TAGNO?.trim()) {
    
        return "it's a Taged Item Please enter tag no";
    }

    if (Number(row.GRSWT) <= 0) {
        return "Gross weight must be > 0";
    }

    if (Number(row.TOUCH) <= 0) {
        return "TOUCH must be > 0";
    }

    if (!row._miscCharges || row._miscCharges.length <= 0) {
        return "Other charges are required";
    }

    const hasHmc = row._miscCharges.some((charge: any) =>
        charge.chargeName.trim().toUpperCase() === "HMC"
    );

    if (!hasHmc) {
        return "HMC charge is required in other charges";
    }

    return null;
 

    return null;
};

export const validateSalesReturn = (row: any, validationCheck?: any) => {


    if (validationCheck && !row.TAGNO && !row.BILLNO ) {
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