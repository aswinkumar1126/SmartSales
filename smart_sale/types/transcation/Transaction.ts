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
    TRANSACTION_TYPE?: string;
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