import { FormField } from "@/types/form/form";

type TouchMasterCollections = {
    collection:{
        actype: { label: string; value: string }[];
        accode: { label: string; value: string }[];
        itemId: { label: string; value: string }[];
        calMode: { label: string; value: string }[];

        
    },
    disabled:{
        isAccode:boolean
    }

};

export const TouchMasterFormConfig = ({collection:{actype,accode ,itemId ,calMode} , disabled:{isAccode}}:TouchMasterCollections):FormField[]  => [
    {
        name: "actype",
        label: "PARTY TYPE",
        type: "combobox",
        size: "sm",
        required: true,
        rounded: "sm",
        items: actype || [],

    },
    {
        name: "accode",
        label: "PART NAME",
        type: "combobox",
        size: "sm",
        required: true,
        rounded: "sm",
        items: accode  || [],
        disabled: isAccode
    },
    {
        name: "itemId",
        label: "ITEM NAME",
        type: "combobox",
        size: "sm",
        required: true,
        rounded: "sm",
        items: itemId || [],
        disabled: isAccode
    },
    {
        name: "touch",
        label: "TOUCH",
        type: "number",
        size: "sm",
        required: true,
        rounded:"sm",
        decimalScale: 2,
        allowFocus: true,
        disabled: isAccode
    },
    {
        name: "calmode",
        label: "CAL MODE",
        type: "select",
        size: "sm",
        required: true,
        rounded: "sm",
        items: calMode || [],
        disabled: isAccode,
     
    },
];