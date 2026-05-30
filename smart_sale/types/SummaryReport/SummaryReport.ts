export interface ItemStockEntry {
  ITEMID: number | null;
  ITEMNAME: string|null;
  PUREID: number | null;
  PUREGOLDNAME: string|null;
  OP_PCS:  number | String | null;
  OP_GRSWT:  number | String | null;
  OP_NETWT:  number | String | null;
  OP_STNWT:  number | String | null;
  RE_PCS:  number | String | null;
  RE_GRSWT:  number | String | null;
  RE_NETWT:  number | String | null;
  RE_STNWT:  number | String | null;
  IS_PCS:  number | String | null;
  IS_GRSWT:  number | String | null;
  IS_NETWT:  number | String | null;
  IS_STNWT:  number | String | null;
  CL_PCS: number | String | null;
  CL_GRSWT:  number | String | null;
  CL_NETWT:  number | String | null;
  CL_STNWT:  number | String | null;
  METALID: number | String | null;
  METALNAME: string | null;
  STOCKTYPE: string | null;
  SRC: string | null;
}

export interface ItemStockReportResponse {
  success: boolean;
  message: string;
  data: ItemStockEntry[];
}


export interface OutStandingStockReportParams {
  STOCKTYPE?: string,
  METAL?:string;
  STUDDED?:string;
  ITEMNAME?:string;
  STONE_PRESENT?:string;

}

export interface AgeReportParams {
  FROMAGE?:number ;
  TOAGE?:number;
  ITEMID?:number
}