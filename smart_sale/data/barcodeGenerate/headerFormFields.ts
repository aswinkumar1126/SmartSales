import { FormField } from '@/types/form/form';


export const barcodeHeaderFields = (  options :{vendorCollection?: {
    label: string;
    value: string;}[],

    inwardCollection?:
    { label: string; value: string; }[],

    itemCollection?:
    { label: string; value: string; }[]


}):FormField[] => ( [
    {   
        name: "ENTRYNO", 
        label: "ENTRY NO", 
        type: "text" 
    },

    { 
        name: "DATE", 
        label: "DATE", 
        type: "date",
        defaultValue: new Date().toISOString().split("T")[0],
        maxDate:new Date().toISOString().split("T")[0],


    },
    { 
        name: "COMPANYTYPE", 
        label: "COMPANY TYPE", 
        type: "select",
        items: [
            {label:'PURCHASER' , value:'PR'},
        ], 
        defaultValue:'PR',
        css:
        { width: "180px"  , background:'#FAE4BC' }

    },
    { 
        name: "COMPANYNAME", 
        label: "COMPANY NAME", 
        type: "combobox" ,
        items: options.vendorCollection || [],
        dependsOn: "COMPANYTYPE"
    },
    { 
        name: "INWARDNO", 
        label: "INWARD NO", 
        type: "combobox",
        items:options.inwardCollection || [], 
        dependsOn:"COMPANYNAME"
    },
    { 
        name: "ITEMNAME", 
        label: "ITEM NAME", 
        type:"combobox",
        items:options.itemCollection || [], 
        dependsOn:"INWARDNO"
        
    },


]
 );
