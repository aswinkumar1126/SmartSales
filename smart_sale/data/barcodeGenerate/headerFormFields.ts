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
        type: "text" ,
        rounded:'sm',
        maxWidth:'80px',
        disabled:true,
    },

    { 
        name: "DATE", 
        label: "DATE", 
        type: "date",
        rounded:'sm',
        maxWidth: '100px'


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
        { width: "180px"  , background:'#faf1e0'  ,borderRadius:'4px'}

    },
    { 
        name: "COMPANYNAME", 
        label: "COMPANY NAME", 
        type: "combobox" ,
        items: options.vendorCollection || [],
        dependsOn: "COMPANYTYPE",
        rounded:'sm',
    },
    { 
        name: "INWARDNO", 
        label: "INWARD NO", 
        type: "combobox",
        items:options.inwardCollection || [], 
        dependsOn:"COMPANYNAME",
        rounded: 'sm',
    },
    { 
        name: "ITEMNAME", 
        label: "ITEM NAME", 
        type:"combobox",
        items:options.itemCollection || [], 
        dependsOn:"INWARDNO",
        rounded: 'sm',

                
    },


]
 );
