export interface PurchaseTransactionList {
    snoList: number[],
    ENTRYNO: number;
    BILLNO?:number;
}


export interface ApprovalTransactionList  {
    snoList: number[],
    ENTRYNO: number;
    BILLNO?: number;
}