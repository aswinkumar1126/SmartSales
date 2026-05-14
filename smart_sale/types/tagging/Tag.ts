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

    PURCHASESTNWT :number;
    NAVAWT:number;
    STNWT: number;
    WASPER?: number;
    DIAWT: number;
    
    SALESSTNWT: number;
    NETWT?: number;
    SIZE: string;

    MC?: number;
    TOUCH?: number;
    UPTIME?: string;
    USERID?: number;
}

export interface CreateTag {
    RETAG?: boolean;
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
    SIZE: string;
    STNWT: number;
    TAGDATE: string;
    TAGNO: string;
    TOUCH: number;
    TRANTYPE?: string | null;
    WASPER: number;
    STNAMT:number;
    STONEDETAILS:
    {
        APPVER?: string | null;
        CALCMODE?: string | null;
        CARRYFLAG?: string | null;
        CLARITYID?: number | null;
        COLORID?: number | null;
        COMPANYID?: number | null;
        COSTID?: number | null;
        CUTID: number | null;
        DESCRIP: string | null;
        HEIGHT: number | null;
        INDRS: string | null;
        ISSDATE: string | null;
        ITEMID: number;
        ITEMNAME: string | null;
        MINRATE: number | null;
        OLDTAGNO: string | null;
        PACKETNO: string | null;
        RECDATE: string | null;
        SALESSTNWT: number;
        SETTYPEID: number | null;
        SHAPEID: number | null;
        SIZE: string | null;
        SNO: number;
        STNAMT: number | null;
        STNGRPID: number | null;
        STNITEMID: number;
        STNPCS: number | null;
        STNRATE: number | null;
        STNSUBITEMID: number | null;
        STNWT: number;
        STONEUNIT: string | null;
        SYSTEMID: number | null;
        TAGMSNO: number | null;
        TAGNO: string;
        TAGSNO: string;
        TRANSFERED: boolean | null;
        TRFVALUE: number | null;
        USERID: number;
        USRATE: number | null;
        VATEXM: boolean | null;
        WIDTH: number | null;

    }[]

}