// Type for each entry in the "data" array
export interface TaggingEntry {
  STNWT: number | null;
  PCS: number | null;
  T_GRSWT: number | null;
  NETWT: number | null;
  T_SALESSTNWT: number | null;
  TRANNO: number | null;
  ACCODE: number | null;
  TRANDATE: string | null;
  T_PCS: number | null;
  T_NETWT: number | null;
  sort_order: number;
  SNO: string;
  ENTRYNO: number | null;
  ITEMID: number | null;
  GRSWT: number | null;
  T_STNWT: number | null;
}

// Type for the full API response
export interface TaggingEntryResponse {
  success: boolean;
  message: string;
  data: TaggingEntry[];
}