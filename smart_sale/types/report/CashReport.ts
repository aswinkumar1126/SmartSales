export interface CashReportParams {

    FROMDATE : string,
    TODATE :string,
    BANKID : number,
    PAYMODE : "CASH" | "BANK"|string,


}

export interface CashReportResponse {
    TRANDATE : string,
    ISSUE: number,
    PARTY :string,
    PARTICULAR :string,
    RECEIPT: number,
    BANKNAME: string,
}

