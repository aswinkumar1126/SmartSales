import { FormField } from "@/types/form/form";

export const BankAccountForm = (accountTypeCollection: { label: string; value: string }[]): FormField[] => [
    {
        name: "ACCOUNTNO",
        label: "ACCOUNT NUMBER",
        type: "text",
        size: "sm",
        required: true,
        rounded: "sm",
    },
    {
        name: "ACCOUNTTYPE",
        label: "ACCOUNT TYPE",
        type: "select", // ✅ select type
        size: "sm",
        required: true,
        rounded: "sm",
        items: accountTypeCollection, // ✅ collection from parent
        defaultValue:''
   
    },
    {
        name: "ACHOLDERNAME",
        label: "ACCOUNT HOLDER NAME",
        type: "text",
        size: "sm",
        required: true,
        rounded: "sm",
    },
    {
        name: "ADDRESS",
        label: "ADDRESS",
        type: "text",
        size: "sm",
        required: false,
        rounded: "sm",
    },
    {
        name: "BANKAC",
        label: "BANK A/C",
        type: "text",
        size: "sm",
        required: false,
        rounded: "sm",
    },
    {
        name: "BANKNAME",
        label: "BANK NAME",
        type: "text",
        size: "sm",
        required: true,
        rounded: "sm",
    },
    {
        name: "BRANCHNAME",
        label: "BRANCH NAME",
        type: "text",
        size: "sm",
        required: true,
        rounded: "sm",
    },
    {
        name: "OPENINGBALANCE",
        label: "OPENING BALANCE",
        type: "number",
        size: "sm",
        required: true,
        rounded: "sm",
        allowFocus: true,
        decimalScale:2,
    },
    {
        name: "REMARKS",
        label: "REMARKS",
        type: "text",
        size: "sm",
        required: false,
        rounded: "sm",
    },
];