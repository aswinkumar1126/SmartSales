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

export interface ItemTransactionRow extends WeightInfo {
    ITEMID?: number | null;

    PCS?: number;
    GRSWT?: number;
    STNWT?: number;
    NETWT?: number;
    WASTYPE?:string;
    WASPER?:number;
    WASTAGE?:number;

    TOUCH?: number;
    PUREWT?: number;
    MC?:number;
    ATOUCH?:number;
    // DESCRIPTION?:string;
}


/* =========================================================
   UNION ROW TYPE (Used in Tables & Draft Rows)
   ========================================================= */

export type TransactionRow = MetalTransactionRow | ItemTransactionRow;


/* =========================================================
   TRANSACTION DETAILS (Matches Backend JSON)
   ========================================================= */

export type TransactionItems = Partial<{
    issue: MetalTransactionRow[];
    receipt: MetalTransactionRow[];
    purchase: ItemTransactionRow[];
    purchase_return: ItemTransactionRow[];
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


/* =========================================================
   CREATE TRANSACTION PAYLOAD
   ========================================================= */

export interface CreateTransaction {
    TRANSACTION_HEADER: TransactionHeader;
    TRANSACTION_DETAILS: TransactionItems;
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
   TABLE DISPLAY TYPE
   ========================================================= */

export interface TransactionTableRow extends ItemTransactionRow {
    SNO?: number | string;
    NEXTID?: number;
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


/* =========================================================
   TYPE GUARDS (IMPORTANT — prevents runtime bugs)
   ========================================================= */

export const isMetalTransaction = (
    row: TransactionRow
): row is MetalTransactionRow => {
    return "PUREID" in row && !("ITEMID" in row);
};

export const isItemTransaction = (
    row: TransactionRow
): row is ItemTransactionRow => {
    return "ITEMID" in row;
};
