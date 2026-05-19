import { FormField } from "@/types/form/form";


type collection = { label: string, value: string }
type CashReportForm = {

payModeList: collection[],
bankAccountList: collection[],
isDisableBank : boolean

}

export const CashReportFields = (CashReportForm: CashReportForm ): FormField[] =>  [
    
   {
     name : "PAYMODE" ,
     label : "MODE" ,
     items : CashReportForm.payModeList ,
     type : "combobox",
     required : true

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
        items : CashReportForm.bankAccountList,
        required : true,
        disabled : CashReportForm.isDisableBank

    },
   
   
];