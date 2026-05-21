export interface StoneMapping {

    acType?: string;
    acName?: string;
    itemName?: string;
    stnAmt?: string;

}

export interface StoneMappingForm {
    // acType: string;
    accode: number;
    itemId: number;
    stnAmt: number;
}

export interface StoneMappingMaster {
    acType: string;
    accode: string;
    itemId: string;
    stnAmt: string;
}

export interface StoneMappingFilter {
    ACCODE: number;
    ITEMID: number;
}

export interface GetStoneMappingByFilter {
    STNAMT: number;
}