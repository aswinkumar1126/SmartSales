export interface PurchaseTransactionList {
    snoList: number[],
    ENTRYNO: number;
    BILLNO?:number;
}


export interface ApprovalTransactionList  {
    SNOLIST: number[],
    ENTRYNO: number;
    BILLNO?: number;
}