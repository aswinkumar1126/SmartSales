import { FormField } from "@/types/form/form";

export const getItemSizeFields = (collection: { itemCollection?: { label: string; value: string }[] }): FormField[] => [

    
    {
        name: "ITEMID",
        label: "ITEM NAME",
        type: "combobox",
        required: true,
        size: "xs",
        rounded: "sm",
        options:collection.itemCollection
    },
    {
        name: "SIZENAME",
        label: "SIZE NAME",
        type: "text",
        size: "xs",
        rounded: "sm",
        required: true,
      
    },
];