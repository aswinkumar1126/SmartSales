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

