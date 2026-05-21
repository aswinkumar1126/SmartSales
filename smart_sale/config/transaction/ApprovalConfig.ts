
export const getIsTagEnabled = (approvalTranType?: string) => {
    if (!approvalTranType) return false;
    if (approvalTranType === "APPIS") {
        return true;
    }
}

export const getIsBillModalEnabled = (approvalTranType?: string) => {
    if (!approvalTranType) return false;
    if (approvalTranType === "APPRE") {
        return true;
    }
}