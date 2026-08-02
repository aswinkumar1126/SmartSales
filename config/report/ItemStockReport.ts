import { FormField } from "@/types/form/form";

interface ItemStockReportParams {
    colToShow : {label:string ,value :string}[]
}

export const ItemStockReportFields = (params: ItemStockReportParams ): FormField[] =>  [

    
  
    {
        name: "DATE",
        label: "AS ON DATE",
        type: "date",   
        maxWidth :'100px',
        maxDate : new Date()
    },
    {
        name: "COLUMNS",
        label: "COLUMNS TO SHOW",
        type: "multiCombobox",
        maxWidth: '200px',
        items : params.colToShow ,
        // defaultValue :'WT'
    },

];