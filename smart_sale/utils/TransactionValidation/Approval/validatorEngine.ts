
export const validateApprovalIssue = (row: any) => {

    if (!row.ITEMID) {
        return "Please select an item";
    }

    if (Number(row.GRSWT) <= 0) {
        return "Gross weight must be > 0";
    }

    if (Number(row.TOUCH) <= 0) {
        return "TOUCH must be > 0";
    }
    return null;
 

};

export const validateApprovalReceipt = (row: any, validationCheck?: any) => {

    if (Number(row.GRSWT) <= 0) {
        return "Gross weight must be > 0";
    }

    
    return null;
};



export const VALIDATORS: Record<string, Function> = {
    APPROVAL_ISUUE : validateApprovalIssue ,
    APPROVAL_RECEIPT : validateApprovalReceipt
};