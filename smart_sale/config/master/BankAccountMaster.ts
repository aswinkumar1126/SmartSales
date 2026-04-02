import { FormField } from "@/types/form/form";

export const BankAccountForm = (accountTypeCollection: { label: string; value: string }[]): FormField[] => [
    {
        name: "ACCOUNTNO",
        label: "Account Number",
        type: "text",
        size: "sm",
        required: true,
        rounded: "sm",
    },
    {
        name: "ACCOUNTTYPE",
        label: "Account Type",
        type: "select", // ✅ select type
        size: "sm",
        required: true,
        rounded: "sm",
        items: accountTypeCollection, // ✅ collection from parent
   
    },
    {
        name: "ACHOLDERNAME",
        label: "Account Holder Name",
        type: "text",
        size: "sm",
        required: true,
        rounded: "sm",
    },
    {
        name: "ADDRESS",
        label: "Address",
        type: "text",
        size: "sm",
        required: false,
        rounded: "sm",
    },
    {
        name: "BANKAC",
        label: "Bank A/C",
        type: "text",
        size: "sm",
        required: false,
        rounded: "sm",
    },
    {
        name: "BANKNAME",
        label: "Bank Name",
        type: "text",
        size: "sm",
        required: true,
        rounded: "sm",
    },
    {
        name: "BRANCHNAME",
        label: "Branch Name",
        type: "text",
        size: "sm",
        required: true,
        rounded: "sm",
    },
    {
        name: "OPENINGBALANCE",
        label: "Opening Balance",
        type: "number",
        size: "sm",
        required: true,
        rounded: "sm",
        allowFocus: true,
        decimalScale:2,
    },
    {
        name: "REMARKS",
        label: "Remarks",
        type: "text",
        size: "sm",
        required: false,
        rounded: "sm",
    },
];