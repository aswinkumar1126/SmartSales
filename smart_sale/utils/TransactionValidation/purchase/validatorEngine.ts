
export const validatePurchase = (row: any) => {


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
 

    return null;
};
export const validatePurchaseReturn = (row: any) => {

    
    if (row.ITEM_TYPE === "TAGGED" && !row.TAGNO?.trim()) {

        return "it's a Taged Item Please enter tag no";
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
    Purchase: validatePurchase,
    Purchase_return: validatePurchaseReturn,
    issue: validateIssue,
    receipt: validateReceipt,
};