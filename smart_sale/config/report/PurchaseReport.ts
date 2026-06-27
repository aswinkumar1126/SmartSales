import { FormField } from "@/types/form/form";


type collection = { label: string, value: string }
type PurchaseReportForm = {
    purchaserList: collection[],
}

export const PurchaseReportFields = (PaymentReportForm: PurchaseReportForm ): FormField[] =>  [
  
    {
        name: "FROMDATE",
        label: "FROM DATE",
        type: "date",   
        maxDate : new Date(),
        maxWidth :'100px'
    
    },
    {
        name: "TODATE",
        label: "TO DATE",
        type: "date",
        maxDate: new Date(),
        maxWidth: '100px'
    },
    {
        name: "ACCODE",
        label:"PURCHASER NAME",
        type: "combobox",
        items: PaymentReportForm.purchaserList,
    },
   
   
];