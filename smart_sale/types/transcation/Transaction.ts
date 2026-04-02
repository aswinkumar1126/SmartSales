/* =========================================================
   TRANSACTION CORE TYPES
   ========================================================= */

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
/** All supported transaction keys (extend here only) */
export type TransactionKey =
    | "issue"
    | "receipt"
    | "purchase"
    | "purchase_return";


/* =========================================================
   COMMON WEIGHT STRUCTURE (Reusable Everywhere)
   ========================================================= */

export interface WeightInfo {
    WT?: number;
    TOUCH?: number;
    PUREWT?: number;

    AWT?: number;
    ATOUCH?: number;
    APUREWT?: number;
}


/* =========================================================
   METAL TRANSACTION (Issue / Receipt)
   ========================================================= */

export interface MetalTransactionRow extends WeightInfo {
    PUREID?: number;
}


/* =========================================================
   ITEM TRANSACTION (Purchase / Return / Sales)
   ========================================================= */

export interface purchasePayload {


    ITEMID: number | null;
    
    SNO?:string;

    PCS: number;

    GRSWT: number;
    STNWT: number;
    NETWT: number;

    WASTYPE:string;
    // WASPER:number;
    // WASTAGE:number;

    
    TOUCH: number;
    PUREWT: number;

    HMC:number;

    STNAMT:number;
    MC:number;
    // ATOUCH:number;
    DESCRIPTION?:string;
}


export interface purchasereturnPayload {

    ITEMID: number | null;
    SNO?: string;
    TAGNO?:string;
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

/* =========================================================
   UNION ROW TYPE (Used in Tables & Draft Rows)
   ========================================================= */

export type TransactionRow = MetalTransactionRow;


/* =========================================================
   TRANSACTION DETAILS (Matches Backend JSON)
   ========================================================= */

export type TransactionItems = Partial<{
    issue: MetalTransactionRow[];
    receipt: MetalTransactionRow[];
    purchase: purchasePayload[];
    purchase_return: purchasereturnPayload[];
}>;


/* =========================================================
   HEADER INFO (Backend Payload)
   ========================================================= */

export interface TransactionHeader {
    ACCODE: number;
    TRANDATE: string;

    ENTRYNO?: number;
    BILLNO?: number;
    RATE?: number;
}

export interface BankTransactionDetails {
    bankName: string,
    tranMode: "C" | "F" | "I" | "N" |"R" | "U",
    tranDate:string,
    chqNo: string,
    amount: number
}

export interface BankTransactionFormDetails {
    id:string;
    bankName: string,
    tranMode: "C" | "F" | "I" | "N" | "R" | "U",
    tranDate: string,
    chqNo: string,
    amount: string
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


/* =========================================================
   CREATE TRANSACTION PAYLOAD
   ========================================================= */

export interface CreateTransaction {
    TRANSACTION_HEADER: TransactionHeader;
    TRANSACTION_DETAILS?: TransactionItems;
    CLOSING_DETAILS?: ClosingDetails;
}


/* =========================================================
   UPDATE TRANSACTION PAYLOAD
   ========================================================= */

export interface UpdateTransactionPayload {
    TRANSACTION_DETAILS: {
        ACCODE: number;
        TRANTYPE: TransactionKey;
        TRANDATE: string;
    };

    TRANSACTION_ITEM: TransactionRow | null;
}




/* =========================================================
   MENU / SIDEBAR TRANSACTION TYPE
   ========================================================= */

export interface TransactionType {
    code: "ISP" | "REC" | "PU" | "PR";   // UI short code
    key: TransactionKey;                 // backend key
    label: string;
    value?: string;                      // optional value for compatibility
    icon?: React.ComponentType<any>;
}

export const TRANSACTION_KEY_MAP: Record<string, TransactionKey> = {
    ISP: "issue",
    REC: "receipt",
    PU: "purchase",
    PR: "purchase_return",
};

