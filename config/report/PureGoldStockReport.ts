import { FormField } from "@/types/form/form";

interface PureGoldReportParams {
    colToShow : {label:string ,value :string}[]
}

export const PureGoldStockReportFields = (params: PureGoldReportParams ): FormField[] =>  [

    
  
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