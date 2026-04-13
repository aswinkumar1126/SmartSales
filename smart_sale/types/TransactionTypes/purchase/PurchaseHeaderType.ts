// types/salesHeader.ts

export interface PurchaseHeaderForm {
    CUSTOMER: string;
    CUSTOMER_NAME: string;
    DATE: string;
    BILLNO: string;
    ENTRYNO: string;
    RATEGM: string | number;
}

export interface PurchaseHeaderState {
    headerForm: PurchaseHeaderForm;
    accCode: number | null;

    isEditing: boolean;
    editingSno: string | null;
    selectedTransactionId: string | null;
}