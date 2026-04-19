export interface BarcodeDetailsPayload{

    ENTRYNO: string;
    DATE: string;
    COMPANYTYPE: "PR";
    COMPANYNAME: number |string;
    INWARDNO: string|number;
    ITEMNAME: string | number;

}

export interface BarCodeFilter{

    ACCODE?:number;
    PURCHASE_ENTRYNO?:number;
    SNO?:string;
    ISEDITING?:boolean;
    ENTRYNO?:number;

}
export interface BarcodeItemList {
    
    ITEMID?:number;
    ITEMNAME?:string;
    REORDPCS?:null
    REORDWT?:null
    SHORTNAME?:null
    SIZEID:number
    SIZENAME:string
    TAGNO:null
  
}

export interface barcodeTagNumber {
    PREFIX : string;
    TAGNO : number
}

export interface SELECTED_BARCODE_ITEM {


    ACCODE: number | null;
    APUREWT: number | null;
    ATOUCH: number | null;
    AWT: number | null;
    BATCHNO: string | null;
    BILLNO: number | null;
    DESCRIPTION: string | null;
    ENTRY_NO: number | null;
    GRSWT: number;
    HMC: number | null;
    ITEMID: number | null;
    MC: number | null;
    NETWT: number | null;
    PCS: number | null;
    PURCHASENO: string | null;
    PUREID: number | null;
    PUREWT: number | null;
    RATE: number | null;
    SNO: string | null;
    STNAMT: number | null;
    STNWT: number | null;
    TAGGED: string | null;
    TOUCH: number | null;
    TRANDATE: string | null;
    TRANNO: number | null;
    TRANTYPE: string | null;
    WASPER: number | null;
    WASTAGE: number | null;
    WASTYPE: string | null;
    WT: number | null;
    otherChargesDetails: any | null;
    stoneDetails: any | null;
    STNPRESENT: "Y" | "N" | string;
}

export interface BarcodeDetails{

    ENTRY_NO:number;
    PURCHASE_ENTRY_NO:number[];

    ITEMLIST:{
            ITEMID:string,
            ITEMNAME:number,
            SNO:number,
        }[];
    SELECTED_ITEM : SELECTED_BARCODE_ITEM | null;
    SIZELIST: BarcodeItemList[] | [];
    TAGNO: barcodeTagNumber | null  ;

}

