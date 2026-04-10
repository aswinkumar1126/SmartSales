export interface BankTransaction {
    draftRowId: string;
    id: string;
    bankName: string;
    tranMode: "C" | "F" | "I" | "N" | "R" | "U";
    tranDate: string;
    chqNo: string;
    amount: number;
}

export interface BankTransactionPayload {
    draftRowId: string;
    id: string;
    bankName: number;
    tranMode: "C" | "F" | "I" | "N" | "R" | "U";
    tranDate: string;
    chqNo: string;
    amount: number;
}

export interface BaseClosingFormDetails {
    convType: "P" | "C" | "" | string;
    convAmt: string;
    convWt: string;
    cashPaid: string;
    cashRcvd: string;
    bankPaid: string;
    bankRcvd: string;
    bankPaidDetails: BankTransaction[];
    bankRcvdDetails: BankTransaction[];
}

export interface BaseClosingPayloadDetails {
    convType: "P" | "C" | "" | string;
    convAmt: string;
    convWt: string;
    cashPaid: string;
    cashRcvd: string;
    bankPaid: string;
    bankRcvd: string;
    bankPaidDetails: BankTransaction[];
    bankRcvdDetails: BankTransaction[];
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