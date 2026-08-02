export interface ExpenseOpeningCreateRequest {
    date: string;        // "YYYY-MM-DD"
    expId: number;
    cashAmt: number;
    bankAmt: number;
    remarks: string;
    chequeNo: string;
    bankId: number;
}

export interface ExpenseOpeningResponse {
    entryNo: number;
    date: string;        // "YYYY-MM-DD"
    expId: number;
    cashAmt: number;
    bankAmt: number;
    remarks?: string;
    chequeNo?: string;
    bankId?: number;
    userId?: number;
    updated: string;     // ISO datetime
    expName?: string;    // transient field from backend
    userName?:string;
}