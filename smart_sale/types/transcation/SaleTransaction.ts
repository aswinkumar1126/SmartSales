export type SaleTransactionKey =
    | "sales"
    | "issue"
    | "receipt"
    | "sales_return";



export interface SaleTransactionType {
    code: "IS" | "RE" | "SA" | "SR";  
    key: SaleTransactionKey;                 
    label: string;
    value?: string;                    
    icon?: React.ComponentType<any>;
}

export interface SALESTRANSACTIONITEMS {

    ITEMID: number | null;
    SNO?: string;
    TAGNO?: string;
    PCS: number;
    GRSWT: number;
    STNWT: number;
    NETWT: number;
    WASTYPE: string;
    TOUCH: number;
    PUREWT: number;
    HMC: number;
    STNAMT: number;
    MC: number;
    DESCRIPTION?: string;
}
 
export interface ISSUETRANSACTIONITEMS {

    WT: number;
    TOUCH: number;
    PUREWT?: number;

    AWT?: number;
    ATOUCH?: number;
    APUREWT?: number;
}


export type SaleTransactionItems = Partial<{

    sales : SALESTRANSACTIONITEMS[];
    sales_return: SALESTRANSACTIONITEMS[];
    issue: ISSUETRANSACTIONITEMS[];
    receipt: ISSUETRANSACTIONITEMS[];

}>;

export const SALE_TRANSACTION_KEY_MAP: Record<string, SaleTransactionKey> = {
    SA: "sales",
    SR: "sales_return",
    IS: "issue",
    RE: "receipt",
};

export interface BankTransactionDetails {
    bankName: string,
    tranMode: "C" | "F" | "I" | "N" | "R" | "U",
    tranDate: string,
    chqNo: string,
    amount: number
}

export interface ClosingDetails {

    convType: "" | "P" | "C" | string;
    convAmt: number;
    convWt: number;
    discAmt: number;
    discWt: number;

    cashPaid: number;
    cashRcvd: number;

    bankPaid: number;
    bankRcvd: number;
    bankPaidDetails: BankTransactionDetails[];
    bankRcvdDetails: BankTransactionDetails[];

}
export interface ClosingDetails {

    convType: "" | "P" | "C"|string ;
    convAmt: number;
    convWt: number;
    discAmt: number;
    discWt: number;

    cashPaid: number;
    cashRcvd: number;

    bankPaid: number;
    bankRcvd: number;
    bankPaidDetails: BankTransactionDetails[];
    bankRcvdDetails: BankTransactionDetails[];

}
export interface TransactionHeader {
    ACCODE: number;
    TRANDATE: string;

    ENTRYNO?: number;
    BILLNO?: number;
    RATE?: number;
}


export interface CreateSaleTransaction {
    TRANSACTION_HEADER: TransactionHeader;
    TRANSACTION_DETAILS?: SaleTransactionItems;
    CLOSING_DETAILS?: ClosingDetails;
}

