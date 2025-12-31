 
export interface CreateParty {

    companyType:string,
    companyId:string,
    bookName:string,
    slipNo:number,
    openWeight:number,
    openPure:number,
    openCash:number,
    userId:number, 
}

export interface GetParty{

   sno:number,
   companyType:string,
   companyId:string,
   companyName?:string,
   COMPANYNAME:String;
   bookName:string,
   slipNo:number,
   openWeight:number,
   openPure:number,
   openCash:number,
   userId:number
}
export interface PartyForm {
    companyType: string;
    companyId: string;
    bookName: string,
    slipNo: string;
    openWeight: string;
    openPure: string;
    openCash: string;
    userId: string;
}