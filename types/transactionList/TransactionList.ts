export interface PurchaseTransactionList {
    snoList: number[],
    ENTRYNO: number;
    BILLNO?:number;
}




export interface ApprovalTransactionList  {
    SNOLIST: {
        SNO: number;
        BATCHNO: number;
    }[],
    ENTRYNO: number;
    BILLNO?: number;
}