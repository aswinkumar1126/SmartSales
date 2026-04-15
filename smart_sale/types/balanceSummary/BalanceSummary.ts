export interface BankTransaction {
    DRAFTROWID: string;
    ID: string;
    BANKID: string;
    TRANMODE: "C" | "F" | "I" | "N" | "R" | "U";
    PAYDATE: string;
    CHQNO: string;
    AMOUNT: number;
}

export interface BankTransactionPayload {
    DRAFTROWID: string;
    ID: string;
    BANKID: number;
    TRANMODE: "C" | "F" | "I" | "N" | "R" | "U";
    PAYDATE: string;
    CHQNO: string;
    AMOUNT: number;
}

export interface BaseClosingFormDetails {
    CONVTYPE: "P" | "C" | "" | string;
    CONVAMT: string;
    CONVWT: string;
    CASHPAID: string;
    CASHRCVD: string;
    BANKPAID: string;
    BANKRCVD: string;
    BANKPAIDDETAILS: BankTransaction[];
    BANKRCVDDETAILS: BankTransaction[];
}

export interface BaseClosingPayloadDetails {
    CONVTYPE: "P" | "C" | "" | string;
    CONVAMT: string;
    CONVWT: string;
    CASHPAID: string;
    CASHRCVD: string;
    BANKPAID: string;
    BANKRCVD: string;
    BANKPAIDDETAILS: BankTransaction[];
    BANKRCVDDETAILS: BankTransaction[];
}




export interface OpeningBalances {
    openCash: number;
    openPure: number;
}

export interface ClosingCalculationResult {
    closingCash: number;
    closingPure: number;
}

export interface PurchaseClosingFormDetails extends BaseClosingFormDetails {

}

export interface SalesClosingFormDetails extends BaseClosingFormDetails {

}