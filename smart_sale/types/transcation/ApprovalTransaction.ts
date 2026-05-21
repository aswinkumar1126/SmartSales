export type ApprovalTransactionKey =
    | "APPROVAL_ISSUE"
    | "APPROVAL_RECEIPT"



export interface ApprovalTransactionType {
    code: "APPIS" | "APPRE";
    key: ApprovalTransactionKey;
    label: string;
    value?: string;
    icon?: React.ComponentType<any>;
}

export interface APPROVALTRANSACTIONITEMS {

    ITEMID: number | null;
    TAGNO?: string;
    PCS: number;
    GRSWT: number;
    STNWT: number;
    NETWT: number;
    TOUCH: number;
    PUREWT: number;
    HMC: number;
    STNAMT: number;
    MC: number;
    DESCRIPTION?: string;

    BILLNO?: number;
    SNO?: string;

}


export type ApprovalTransactionItems = Partial<{

    APPROVAL_ISSUE: APPROVALTRANSACTIONITEMS[];
    APPROVAL_RECEIPT: APPROVALTRANSACTIONITEMS[];

}>;

export const APPROVAL_TRANSACTION_KEY_MAP: Record<string, ApprovalTransactionKey> = {
    APPIS: "APPROVAL_ISSUE",
    APPRE: "APPROVAL_RECEIPT"
};

export interface BankTransactionDetails {

    BANKID: string,
    TRANMODE: "C" | "F" | "I" | "N" | "R" | "U",
    PAYDATE: string,
    CHQNO: string,
    AMOUNT: number
}

// export interface ClosingDetails {

//     CONVTYPE: "" | "P" | "C" | string;
//     CONVAMT: number;
//     CONVWT: number;
//     DISCAMT?: number;
//     DISCWT?: number;

//     CASHPAID: number;
//     CASHRCVD: number;

//     GSTAMT: number;
//     GSTPER: number;

//     TDSAMT: number;
//     TDSPER: number;

//     BANKPAID: number;
//     BANKRCVD: number;
//     BANKPAIDDETAILS: BankTransactionDetails[];
//     BANKRCVDDETAILS: BankTransactionDetails[];

// }

export interface TransactionHeader {
    ACCODE: number;
    TRANDATE: string;

    ENTRYNO?: number;
    BILLNO?: number;
    RATE?: number;

    REMARK: string;
    THRU: string;
}


export interface CreateApprovalTransaction {
    TRANSACTION_HEADER: TransactionHeader;
    TRANSACTION_DETAILS?: ApprovalTransactionItems;
    // CLOSING_DETAILS?: ClosingDetails;
}


// export type ApprovalBankTransaction = {

//     AMOUNT: number;
//     BANKID: string | null;
//     CHQNO: string | null;
//     PAYDATE: string | null;
//     TRANMODE: string | null;
// }

// export interface ApprovalCLosing {
//     ACCODE: number;
//     BANKPAID: number;
//     BANKPAIDDETAILS: ApprovalBankTransaction[];
//     BANKRCVD: number;
//     BANKRCVDDETAILS: ApprovalBankTransaction[];
//     BATCHNO: string;
//     BILLNO: number;
//     CASHPAID: number;
//     CASHRCVD: number;
//     CONVAMT: number;
//     CONVTYPE: string;
//     CONVWT: number;
//     DISCAMT: number;
//     DISCWT: number;
//     ENTRYNO: number;
//     PURCHASENO: string;
//     RATE: number;
//     TRANDATE: string | null;
// };
export interface TRANSACTION {   
    
    SNO?: string | number; 
    ITEM?: string | number; // ITEMID 
    PCS?: number; 
    GRSWT?: number; 
    LESSWT?: number; 
    NETWT?: number; 
    TOUCH?: number; 
    PUREWT?: number; 
    RATE?: number; 
    MCHARGE?: number; // MAKING COST 
    WASTAGE?: number; 
    ISSUES?: any; 
    NEXTID?: number 
}