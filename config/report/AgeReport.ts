import { FormField } from "@/types/form/form";

interface AgeReportParams {

    itemList: { label :string ,value :string}[],
    
}

export const AgeReportFields = (params: AgeReportParams ): FormField[] =>  [

    {
        name :"ITEMID",
        type :"combobox",
        items : params.itemList,
        label : "ITEM NAME",
        maxWidth :"250px"
    },
  
    {
        name: "FROMAGE",
        label: "FROM AGE",
        type: "number",   
        maxWidth :'100px'
    },
    {
        name: "TOAGE",
        label: "TO AGE",
        type: "number",
        maxWidth: '100px'
    },

];