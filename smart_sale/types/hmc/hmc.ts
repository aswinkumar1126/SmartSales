export interface Hmc {

    acType?: string;
    acName?: string;
    itemName?: string;
    hmcAmt?: string;

}

export interface HmcForm {
    // acType: string;
    accode: number;
    itemId: number;
    hmcAmt: number;
}

export interface HmcMaster {
    acType: string;
    accode: string;
    itemId: string;
    hmcAmt: string;
}

export interface HmcFilter {
    CUSTOMER: number;
    ITEMTYPE: number;
}

export interface GetHmcByFilter {
    HMCAMOUNT: number;
}