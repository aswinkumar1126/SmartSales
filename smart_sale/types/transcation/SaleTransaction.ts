export type SaleTransactionKey =
    | "sales"
    | "sales_return"
    | "issue"
    | "receipt"
   


export interface SaleTransactionType {
    code: "IS" | "RE" | "SA" | "SR";  
    key: SaleTransactionKey;                 
    label: string;
    value?: string;                    
    icon?: React.ComponentType<any>;
}

export interface SALESTRANSACTIONITEMS {

    ITEMID: number | null;
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

    BILLNO?:number;
    SNO?: string;

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
    
    BANKID: string,
    TRANMODE: "C" | "F" | "I" | "N" | "R" | "U",
    PAYDATE: string,
    CHQNO: string,
    AMOUNT: number
}

export interface ClosingDetails {

    CONVTYPE: "" | "P" | "C" | string;
    CONVAMT: number;
    CONVWT: number;
    DISCAMT?: number;
    DISCWT?: number;

    CASHPAID: number;
    CASHRCVD: number;

    BANKPAID: number;
    BANKRCVD: number;
    BANKPAIDDETAILS: BankTransactionDetails[];
    BANKRCVDDETAILS: BankTransactionDetails[];

}

export interface TransactionHeader {
    ACCODE: number;
    TRANDATE: string;

    ENTRYNO?: number;
    BILLNO?: number;
    RATE?: number;

    REMARK:string;
    THRU:string;
}


export interface CreateSaleTransaction {
    TRANSACTION_HEADER: TransactionHeader;
    TRANSACTION_DETAILS?: SaleTransactionItems;
    CLOSING_DETAILS?: ClosingDetails;
}


export type SalesBankTransaction = {

    AMOUNT: number;
    BANKID: string | null;
    CHQNO: string | null;
    PAYDATE: string | null;
    TRANMODE: string | null;
}

export interface SalesCLosing{
    ACCODE: number;
    BANKPAID: number;
    BANKPAIDDETAILS: SalesBankTransaction[];
    BANKRCVD: number;
    BANKRCVDDETAILS: SalesBankTransaction[];
    BATCHNO: string;
    BILLNO: number;
    CASHPAID: number;
    CASHRCVD: number;
    CONVAMT: number;
    CONVTYPE: string;
    CONVWT: number;
    DISCAMT: number;
    DISCWT: number;
    ENTRYNO: number;
    PURCHASENO: string;
    RATE: number;
    TRANDATE: string | null;
};