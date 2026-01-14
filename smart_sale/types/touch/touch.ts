export interface Touch {
    companyType?:string,
    accode?:string;
    itemId?:string;
    touch?:string;
    userId?:string;
    itemName?:string;
    COMPANYNAME?: string;
    calculationMode?:string;
} 

export interface TouchForm {
    companyType:string,
    accode:string,
    itemId:number,
    touch:number, 
}

export interface TouchMaster {
    companyType:string,
    accode:string,
    itemId:string,
    touch:string,
    calculationMode?:string
}

