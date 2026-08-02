// types/salesHeader.ts

export interface PurchaseHeaderForm {

    CUSTOMER: string;
    CUSTOMER_NAME: string;
    DATE: string;
    BILLNO: string;
    ENTRYNO: string;
    RATEGM: string | number;
    METALTYPE: "S" | "G" | string;
    REMARK:string;
    THRU:string;
}

export interface PurchaseHeaderState {


    headerForm: PurchaseHeaderForm;
    accCode: number | null;

    isEditing: boolean;
    isModifying :boolean ;
    editingSno: string | null;
    selectedTransactionId: string | null;

}
