import { FormField } from "@/types/form/form";


type collection = { label: string, value: string }
type PaymentReportForm = {

payModeList: collection[],
bankAccountList: collection[],
isDisableBank : boolean

}

export const PaymentReportFields = (PaymentReportForm: PaymentReportForm ): FormField[] =>  [
    
   {
        name : "PAYMODE" ,
        label : "PAY MODE " ,
        items: PaymentReportForm.payModeList ,
        type : "combobox",
        required : true,
        maxWidth :'120px'

   },
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
        name: "BANKID",
        label:"BANK NAME",
        type: "combobox",
        items: PaymentReportForm.bankAccountList,
        required : true,
        disabled: PaymentReportForm.isDisableBank

    },
   
   
];