import { FormField } from "@/types/form/form";

type HmcMappingCollections = {
    collection: {
        customerType: { label: string; value: string }[];
        customer: { label: string; value: string }[];
        itemType: { label: string; value: string }[];
    };
    disabled: {
        isCustomerDisabled: boolean;
    };
};

export const HmcMappingFormConfig = ({
    collection: { customerType, customer, itemType },
    disabled: { isCustomerDisabled },
}: HmcMappingCollections): FormField[] => [
    {
        name: "customerType",
        label: "CUSTOMER TYPE",
        type: "combobox",
        size: "sm",
        required: true,
        rounded: "sm",
        items: customerType || [],
    },

    {
        name: "customer",
        label: "CUSTOMER",
        type: "combobox",
        size: "sm",
        required: true,
        rounded: "sm",
        items: customer || [],
        disabled: isCustomerDisabled,
    },

    {
        name: "itemType",
        label: "ITEM TYPE",
        type: "combobox",
        size: "sm",
        required: true,
        rounded: "sm",
        items: itemType || [],
        disabled: isCustomerDisabled,
    },

    {
        name: "hmcAmount",
        label: "HMC AMOUNT",
        type: "number",
        size: "sm",
        required: true,
        rounded: "sm",
        decimalScale: 2,
        allowFocus: true,
        disabled: isCustomerDisabled,
    },
];