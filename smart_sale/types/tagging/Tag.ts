export interface PURCHASE_DETAILS{

    TOTALPCS:number;
    ENTRYNO:number;
    PUENTRYNO:number;
    ITEMID:number;
    ACCODE:number;
    PUSNO:string;
    TAGDATE:string;
}

export interface TAGGING_DETAILS{
    
    TAGNO: string;
    GRSWT: number;
    STNWT: number;
    WASPER: number;
    DIAWT: number;
    MC: number;
    TOUCH: number;
    SALESSTNWT: number;
    NETWT: number;
    SIZEID: number;
    UPTIME?: string;
    USERID?: number;
}

export interface CreateTag{

    PURCHASEDETAILS : PURCHASE_DETAILS;
    TAGGINGDETAILS: TAGGING_DETAILS[];
    
}
export interface CreateTagResponse {

    TAGDETAILS: TAGGING_DETAILS[];
    ENTRYNO: number;

}

export interface getTagedEntryNo{
    ENTRYNO:number,
    ITEMNAME:string;
}

