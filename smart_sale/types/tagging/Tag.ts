export interface PURCHASE_DETAILS {

    TOTALPCS: number;
    ENTRYNO: number;
    PUENTRYNO: number;
    ITEMID: number;
    ACCODE: number;
    PUSNO: string;
    TAGDATE: string;
}

export interface TAGGING_DETAILS {

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

export interface CreateTag {

    PURCHASEDETAILS: PURCHASE_DETAILS;
    TAGGINGDETAILS: TAGGING_DETAILS[];

}
export interface CreateTagResponse {

    TAGDETAILS: TAGGING_DETAILS[];
    ENTRYNO: number;

}

export interface getTagedEntryNo {
    ENTRYNO: number,
    ITEMNAME: string;
}

export interface getTagedEntryNoParamsForApi {
    FROMDATE?: string;
    TODATE?: string;
    ITEMID?: number;
    ACCODE?: number;
    ENTRYNO?: number;
    WEIGHT?: number;
    PUENTRYNO?: number;
    TAGNO?: string,
    SEARCH?: string;
}

export interface getTagedEntryNoParams {

    FROMDATE?: string;
    TODATE?: string;

    ITEMID?: string;
    ACCODE?: string;
    ENTRYNO?: string;
    
    WEIGHT?: string;
    PUENTRYNO?: string;
    TAGNO?: string,
    SEARCH?: string;
}


export interface getSingleTagDetail {

    ACCODE: number;
    BILLNO: number | null;
    DIAWT: number;
    ENTRYNO: number;
    GRSWT: number;
    ISSDATE: string | null
    ITEMID: number;
    MC: number;
    NETWT: number;
    PUENTRYNO: number;
    PUSNO: string;
    SALESSTNWT: number;
    SIZEID: number;
    STNWT: number;
    TAGDATE: string;
    TAGNO: string;
    TOUCH: number;
    TRANTYPE?: string | null;
    WASPER: number
}