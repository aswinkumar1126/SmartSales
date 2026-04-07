import { FormField } from "@/types/form/form";

const activeOptions = [
    {label:'YES' ,value:'Y'},
    {label:'NO' ,value:'N'}
] 


export const printerFields: FormField[] = [
    
   
    {
        name: "ipAddress",
        label: "IP ADDRESS",
        type: "text",
        required: true,
        isCapitalized:false
    },
    {
        name: "exeName",
        label: "SYSTEM NAME",
        type: "text",
        required: true,
        isCapitalized: false,

    },
    {
        name: "printerName",
        label: "PRINTER NAME",
        type: "text",
        required: true,
        isCapitalized: false
    },
    {
        name:"active",
        label:"ACTIVE",
        type:"select",
        required:true,
        options:activeOptions
    }
   
];