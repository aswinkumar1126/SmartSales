import { FormField } from "@/types/form/form";

const activeOptions = [
    {label:'YES' ,value:'Y'},
    {label:'NO' ,value:'N'}
] 


export const printerFields: FormField[] = [
    
    // {
    //     name: "IPId",
    //     label: "IP ID",
    //     type: "text",
    //     required: true,
    // },
    {
        name: "IpAddress",
        label: "IP ADDRESS",
        type: "text",
        required: true,
    },
    {
        name: "exeName",
        label: "SYSTEM NAME",
        type: "text",
        required: true,
    },
    {
        name: "printerName",
        label: "PRINTER NAME",
        type: "text",
        required: true,
    },
   
];