
export const validatePurchase = (row: any  ) => {

    console.log(row , "purchaseRow");
    if (!row.ITEMID) {
        return "Please select an item";
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
};
export const validatePurchaseReturn = (row: any  ) => {


    if (row.ITEM_TYPE === "TAGGED" && !row.TAGNO?.trim()) {

        return "it's a Taged Item Please enter tag no";
    }
    if(Number(row.PCS) <= 0){
        return "Pcs are required"
    }
    if (Number(row.GRSWT) <= 0) {
        return "Gross weight must be > 0";
    }

    if (Number(row.TOUCH) <= 0) {
        return "TOUCH must be > 0";
    }
  
    const touch = Number(row.TOUCH);
    const actualTouch =Number(row.ATOUCH);

    console.log(touch, actualTouch, row,"touch and actaul touch")

    if (!touch) {
        return "TOUCH is required";
    }
    if (touch <= 0) {
        return "TOUCH must be > 0";
    }
 
    if (touch > actualTouch) 
        return `Touch do not exists the Actual Touch ${row.ATOUCH}`
    
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
};

export const validateIssue = (row: any) => {
    if (!row.PUREID || row.WT == null || row.TOUCH == null) {
        return "PUREID, WT, TOUCH required";
    }
    if (row.WT <= 0) {
        return "WEIGHT MUST BE REQUIRED"
    }
    if (row.TOUCH <= 0) {
        return "TOUCH MUST BE REQUIRED"
    }
    if (row.ATOUCH <= 0) {
        return "ATOUCH MUST BE REQUIRED"
    }
    return null;
};

export const validateReceipt = validateIssue;




export const VALIDATORS: Record<string, Function> = {
    purchase: validatePurchase,
    purchase_return: validatePurchaseReturn,
    issue: validateIssue,
    receipt: validateReceipt,
};