export interface ItemStockEntry {
  ITEMID: number | null;
  ITEMNAME: string;
  OP_PCS: number;
  OP_GRSWT: number;
  OP_NETWT: number;
  OP_STNWT: number;
  RE_PCS: number;
  RE_GRSWT: number;
  RE_NETWT: number;
  RE_STNWT: number;
  IS_PCS: number;
  IS_GRSWT: number;
  IS_NETWT: number;
  IS_STNWT: number;
  CL_PCS: number;
  CL_GRSWT: number;
  CL_NETWT: number;
  CL_STNWT: number;
}

export interface ItemStockReportResponse {
  success: boolean;
  message: string;
  data: ItemStockEntry[];
}
