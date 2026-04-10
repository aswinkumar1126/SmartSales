export interface BankTransaction {
    draftRowId: string;
    id: string;
    bankName: string;
    tranMode: "C" | "F" | "I" | "N" | "R" | "U";
    tranDate: string;
    chqNo: string;
    amount: number;
}

export interface ClosingFormDetails {
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