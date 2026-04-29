import { FormField } from "@/types/form/form";

type collection ={
    label:string;
    value:string;
}

type ExpensesCollections ={
    expense: collection[];
    bank : collection[];
}

export const getExpenseFields = (collections:ExpensesCollections):FormField[] => [
    {
        name: "ENTRYNO",
        label: "ENTRYNO",
        type: "text",
        disabled:true,
        required :true,
        maxWidth : '120px',

    },
    {
        name: "DATE",
        label: "DATE",
        type: "date",
        required: true,
        maxWidth: '120px',
        maxDate : new Date(),

    },
    {
        name: "EXPENSESID",
        label: "EXPENSES TYPE",
        type: "combobox",
        items: collections.expense || []
    },

    {
        name: "USERID",
        label: "MADE BY",
        type: "text",
        disabled:true,
    },

    {
        name: "CASHAMT",
        label: "CASH",
        type: "number",
    },

    {
        name: "BANKAMT",
        label: "BANK",
        type: "number",
    },

    {
        name: "REMARKS",
        label: "REMARKS",
        type: "text",
    },
    {
        name: "BANKID",
        label: "BANK ACCOUNT TYPE",
        type: "combobox",
        items: collections.bank || []
    },

    {
        name: "CHEQUENO",
        label: "CHEQUE NO",
        type: "text",
    },
];