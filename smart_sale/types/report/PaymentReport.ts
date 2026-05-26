export interface PaymentReportParams {

    FROMDATE : string,
    TODATE :string,
    BANKID : number,
    PAYMODE : "CASH" | "BANK"|string,


}

export interface StatementRow {
    BANKNAME: string | null;
    ISSUE: number | null;
    PARTICULAR: string | null;
    RECEIPT: number | null;
    TRANDATE: string | null;
    TRANTYPE: string | null;
}

export interface PaymentReportResponse {
    OPENING: number;
    CLOSING: number;
    STATEMENT: StatementRow[];
}


