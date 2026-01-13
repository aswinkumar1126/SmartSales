export interface Touch {
    companyType:string,
    companyId:string,
    itemId:string,
    touch:string,
    userId:string,
    itemName:string,
    COMPANYNAME: string
} 

export interface TouchForm {
    companyType:string,
    companyId:string,
    itemId:number,
    touch:number, 
}

export interface TouchMaster {
    companyType:string,
    companyId:string,
    itemId:string,
    touch:string,
    calculationMode?:string
}

