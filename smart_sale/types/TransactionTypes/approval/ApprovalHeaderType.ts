// types/ApprovalHeader.ts

export interface ApprovalHeaderForm {
    
    CUSTOMER: string;
    CUSTOMER_NAME: string;
    DATE: string;
    BILLNO: string;
    ENTRYNO: string;
    RATEGM: string | number;
    REMARK:string;
    THRU:string;
}

export interface ApprovalHeaderState {
    headerForm: ApprovalHeaderForm;
    accCode: number | null;

    isEditing: boolean;
    editingSno: string | null;
    selectedTransactionId: string | null;
}