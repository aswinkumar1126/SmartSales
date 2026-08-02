import { FormField } from "@/types/form/form";

export const RateEntryForm = ():FormField[]  => [
    {
        name: "GOLD 100",
        label: "GOLD 24K",
        type: "number",
        size: "sm",
        required: true,
        icon:true,
        rounded: "sm",
        iconElement:"Rupee",
        decimalScale:2,
        allowFocus:true
    },
    {
        name: "GOLD 916",
        label: "GOLD 916",
        type: "number",
        size: "sm",
        required: true,
        icon: true,
        rounded: "sm",
        iconElement: "Rupee",
        decimalScale: 2,
        allowFocus: true
    },
    {
        name: "SILVER 100",
        label: "SILVER 100",
        type: "number",
        size: "sm",
        required: true,
        icon: true,
        rounded: "sm",
        iconElement: "Rupee",
        decimalScale: 2,
        allowFocus: true
    },
    {
        name: "SILVER 916",
        label: "SILVER 916",
        type: "number",
        size: "sm",
        required: true,
        icon: true,
        rounded:"sm",
        iconElement: "Rupee",
        decimalScale: 2,
        allowFocus: true
    },
];