export interface Hmc {
    customerType?: string;
    customer?: string;
    itemType?: string;
    hmcAmount?: string;

    customerName?: string;
    itemTypeName?: string;
}

export interface HmcForm {
    customerType: string;
    customer: string;
    itemType: number;
    hmcAmount: number;
}

export interface HmcMaster {
    customerType: string;
    customer: string;
    itemType: string;
    hmcAmount: string;
}

export interface HmcFilter {
    CUSTOMER: number;
    ITEMTYPE: number;
}

export interface GetHmcByFilter {
    HMCAMOUNT: number;
}