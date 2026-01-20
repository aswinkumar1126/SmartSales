export interface TRANSACTION {
    SNO?: string | number;
    ITEM?: string|number;        // ITEMID
    PCS?: number;
    GRSWT?: number;
    LESSWT?: number;
    NETWT?: number;
    PURITY?: number;
    PUREWT?: number;
    RATE?: number;
    MCHARGE?: number;     // MAKING COST
    WASTAGE?: number;
    ISSUES?: any;
    NEXTID?: number
}
export interface TransactionType {
    value?: string;
    label?: string;
    icon?: React.ComponentType<any>;
}

export interface TransactionHeader {
    ENTRYNO?: string;
    BILLNO?: string;
    DATE?: string;
    RATEGM?: string;
    CUSTOMER?: string;
    CUSTOMER_NAME?: string;
    TRANSACTION_TYPE?: string;
    TRANSACTION_TITLE?: string;
}

export interface TransactionItem {
    ITEMID?: string;
    PCS?: number;
    GRSWT?: number;
    LESSWT?: number;
    NETWT?: number;
    PURITY?: number;
    PUREWT?: number;
    RATE?: number;
    MCHARGE?: number;
    WASTAGE?: number;
    PUREID?: number | null,
    TOUCH?: number,
   
}


export interface TransactionData {
    header?: TransactionHeader;
    items?: TransactionItem[];
}

export interface DraftRow extends TransactionItem {
    __rowId?: string;
    __isNew?: boolean;
    __previewSno?: number;
}

export interface TransactionInfo{
    ACCODE:number,
    TRANTYPE:string,
    TRANDATE:string
}

export interface CreateTransaction{
    TRANSACTION_DETAILS: TransactionInfo;
    TRANSACTION_ITEMS : TransactionItem[];
}

export type UpdateTransactionPayload = {
    TRANSACTION_DETAILS: {
        ACCODE: number;
        TRANTYPE: string;
        TRANDATE: string;
    };
    TRANSACTION_ITEM: {
        PCS: number;
        GRSWT: number;
        LESSWT: number;
        NETWT: number;
        PURITY: number;
        PUREWT: number;
        RATE: number;
        MCHARGE: number;
        WASTAGE: number;
        AMOUNT: number;
        ITEMID: number | null;
    } | {
        PUREID:number|null,
        GRSWT: number,
TOUCH: number,
    PUREWT: number, 
} | null;
};