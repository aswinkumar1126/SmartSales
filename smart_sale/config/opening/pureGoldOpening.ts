import { FormField } from "@/types/form/form";

export const PureGoldMastForm = (pureCollection: { label: string; value: string }[]): FormField[] => [
    {
        name: "pureId",
        label: "Pure ID",
        type: "combobox", 
        size: "sm",
        required: true,
        rounded: "sm",
        items: pureCollection, 
    },
    {
        name: "weight",
        label: "Weight",
        type: "number",
        size: "sm",
        required: true,
        rounded: "sm",
        allowFocus: true,
        decimalScale: 3,
    },
    {
        name: "actualTouch",
        label: "Actual Touch",
        type: "number",
        size: "sm",
        required: true,
        rounded: "sm",
        allowFocus: true,
        decimalScale: 1,
    },
    {
        name: "actualPure",
        label: "Actual Pure",
        type: "number",
        size: "sm",
        required: true,
        rounded: "sm",
        allowFocus: true,
        decimalScale: 3,
        disabled:true
    },
    // {
    //   name: "metalId",
    //   label: "Metal ID",
    //   type: "combobox",
    //   size: "sm",
    //   required: false,
    //   rounded: "sm",
    //   collection: metalCollection,
    //   allowFocus: true,
    // },
];