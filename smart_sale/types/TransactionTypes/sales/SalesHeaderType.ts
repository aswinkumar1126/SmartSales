// types/salesHeader.ts

export interface SalesHeaderForm {
    CUSTOMER: string;
    CUSTOMER_NAME: string;
    DATE: string;
    BILLNO: string;
    ENTRYNO: string;
    RATEGM: string | number;
    REMARK:string;
    THRU:string;
}

export interface SalesHeaderState {
    headerForm: SalesHeaderForm;
    accCode: number | null;

    isEditing: boolean;
    editingSno: string | null;
    selectedTransactionId: string | null;
}