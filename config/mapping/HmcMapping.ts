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
        name: "acType",
        label: "CUSTOMER TYPE",
        type: "combobox",
        size: "sm",
        required: true,
        rounded: "sm",
        items: customerType || [],
    },

    {
        name: "accode",
        label: "CUSTOMER",
        type: "combobox",
        size: "sm",
        required: true,
        rounded: "sm",
        items: customer || [],
        disabled: isCustomerDisabled,
    },

    {
        name: "itemId",
        label: "ITEM TYPE",
        type: "combobox",
        size: "sm",
        required: true,
        rounded: "sm",
        items: itemType || [],
        disabled: isCustomerDisabled,
    },

    {
        name: "hmcAmt",
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