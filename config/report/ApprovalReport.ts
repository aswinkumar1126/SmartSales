import { FormField } from "@/types/form/form";


type collection = { label: string, value: string }
type ApprovalReportForm = {
    appOptionsList: collection[],
}

export const ApprovalReportFields = (PaymentReportForm: ApprovalReportForm ): FormField[] =>  [
  
   
    {
        name: "TYPE",
        label:"TYPE",
        type: "combobox",
        items: PaymentReportForm.appOptionsList,
        defaultValue:"A"
    },
   
   
];