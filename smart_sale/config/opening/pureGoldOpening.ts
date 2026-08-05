import { FormField } from "@/types/form/form";

export const PureGoldMastForm = (pureCollection: { label: string; value: string }[]): FormField[] => [
    {
        name: "pureId",
        label: "PURE NAME",
        type: "combobox", 
        size: "sm",
        required: true,
        rounded: "sm",
        items: pureCollection, 
    },
    {
        name: "aWt",
        label: "WEIGHT",
        type: "number",
        size: "sm",
        required: true,
        rounded: "sm",
        allowFocus: true,
        decimalScale: 3,
    },
    {
        name: "aTouch",
        label: "ACTUAL TOUCH",
        type: "number",
        size: "sm",
        required: true,
        rounded: "sm",
        allowFocus: true,
        decimalScale: 2,
    },
    {
        name: "aPureWt",
        label: "ACTUAL PURE",
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