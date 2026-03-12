export interface BarcodeDetailsPayload{

    ENTRYNO: string;
    DATE: string;
    COMPANYTYPE: "PR";
    COMPANYNAME: number |string;
    INWARDNO: string|number;
    ITEMNAME: string | number;

}

export interface BarCodeFilter{
    ACCODE?:number|string;
    ENTRYNO?:string|number |null;
    SNO?:number|string|null;
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
    GRSWT: number | null;
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
}

export interface BarcodeDetails{

    NEXT_ENTRY_NO:number;
    ENTRY_NO:number[];
    
    PURCHASE_ITEMS:{
            ITEM_NAME:string,
            ITEM_CODE:number,
            BARCODE_NO:number,
            QTY:number,
            RATE:number,
            AMOUNT:number
        }[];
    SELECTED_ITEM: SELECTED_BARCODE_ITEM |null ;
}