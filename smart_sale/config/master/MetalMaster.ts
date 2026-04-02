import { FormField } from "@/types/form/form";

type metalCollections={
    active:{label:string,value:string}[]
}
export const metalMasterFields = (collection:metalCollections) :FormField[] =>[
    {
        label:"METAL ID",
        name:"metalId",
        type:"text",
        required:true,
        maxWidth:'100px',

    },
    {
        label:"METAL NAME",
        name:"metalName",
        type:"text",
        required:true,

        
    },
    {
        label: "DISPLAY ORDER",
        name: "displayOrder",
        type: "number",
        maxWidth: '100px',
    },
    {
        label:"ACTIVE",
        name:"active",
        type:"select",
        required:true,
        items: collection.active || []
        
    }
]