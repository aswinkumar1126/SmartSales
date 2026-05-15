import { FormField } from "@/types/form/form";

type StoneMappingCollections = {
    collection: {
        customerType: { label: string; value: string }[];
        customer: { label: string; value: string }[];
        itemType: { label: string; value: string }[];
    };
    disabled: {
        isCustomerDisabled: boolean;
    };
};

export const StoneMappingFormConfig = ({
    collection: { customerType, customer, itemType },
    disabled: { isCustomerDisabled },
}: StoneMappingCollections): FormField[] => [
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
        name: "stnAmt",
        label: "STN AMOUNT / GM",
        type: "number",
        size: "sm",
        required: true,
        rounded: "sm",
        decimalScale: 2,
        allowFocus: true,
        disabled: isCustomerDisabled,
    },
];