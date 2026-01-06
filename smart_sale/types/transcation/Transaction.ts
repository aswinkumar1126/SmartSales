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