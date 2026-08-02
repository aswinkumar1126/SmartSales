export interface Touch {
    actype?:string,
    accode?:string;
    itemId?:string;
    touch?:string;
    userId?:string;
    itemName?:string;
    COMPANYNAME?: string;
    calmode?:string;
} 

export interface TouchForm {
    actype:string,
    accode:string,
    itemId:number,
    touch:number, 
    calmode?:string;
}

export interface TouchMaster {
    actype:string,
    accode:string,
    itemId:string,
    touch:string,
    calmode?:string
}

export interface TouchFilter {
    ACCODE : number;
    ITEMID : number;
}

export interface GetTouchByFilter {
    TOUCH: number;
    CALMODE:string;
    STNPRESENT : "Y" | "N"; 
    HMCAMT : number | null;
    STOCKTYPE : "T" | "N" ;
}