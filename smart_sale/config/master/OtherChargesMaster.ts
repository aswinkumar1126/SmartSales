import { FormField } from "@/types/form/form";

type otherChargesCollection ={
    active:{label:string,value:string}[]

}
export const OtherMasterFields = (collection:otherChargesCollection) :FormField[] =>[
   
    {
        label: "CHARGE NAME",
        name: "chargeName",
        type: "text",
        required: true,
        

    },
    {
        label: "AMOUNT",
        name: "chargeAmount",
        type: "number",
        required: true,
        allowFocus:true,
        decimalScale:2

    },
    {
        label:"ACTIVE",
        name:"active",
        type:"select",
        required:true,
        items: collection.active || []
        
    }
]