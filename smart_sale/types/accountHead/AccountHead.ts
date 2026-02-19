export interface AccountHead{

    ACCODE?: string;
    ACNAME?:string;
    ACTYPE?:string;
    ACTIVE?: string;
    STATEID?: string | undefined;
    // COMPANY?:string;
    // DOORNO?:string;
    // COMPANYNAME?:string;
    // COMPANYID?:string;
    // ADDRESS1?:string;
    // ADDRESS2?:String;
    // CITY?:string;
    // AREA?:string;
    // PINCODE?:string;
    // PHONENO?:string;
    // EMAILID?:string;
    // MOBILE?:string;
    // WEBSITE?:string;
    // GSTNO?:string;

    // OPENING_CASH?:string;
    // OPENING_WEIGHT?:string;
    // OPENING_PURE?:string;
    // PAN?:string;
    // AADHARNO?:string;

}

export interface AccountHeadCollection {
    acheads?:AccountHead;
    nextAccode?:string;
}