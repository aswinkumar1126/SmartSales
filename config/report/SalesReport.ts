import { FormField } from "@/types/form/form";


type collection = { label: string, value: string }
type SalesReportForm = {
customerList: collection[],
}

export const SalesReportFields = (PaymentReportForm: SalesReportForm ): FormField[] =>  [
  
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
        label:"CUSTOMER NAME",
        type: "combobox",
        items: PaymentReportForm.customerList,
    },
   
   
];