import { FormField } from "@/types/form/form";

type pureGlodCollections ={
    // active:{label:string,value:string}[]
    metal:{label:string,value:string}[]
}
export const pureGoldNameFields = (collection:pureGlodCollections) :FormField[] =>[
    {
        label:"METAL ID",
        name:"metalId",
        type:"select",
        required:true,
        maxWidth:'120px',
        items:collection.metal || [],
        defaultValue: collection.metal[0]?.value 
 

    },
    {
        label: "PURE GOLD NAME",
        name: "pureGoldName",
        type: "text",
        required: true,
        

    },
    // {
    //     label:"ACTIVE",
    //     name:"active",
    //     type:"select",
    //     required:true,
    //     items: collection.active || []
        
    // }
]