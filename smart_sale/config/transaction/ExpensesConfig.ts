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
        name: "date",
        label: "DATE",
        type: "date",
        required: true,
        maxWidth: '120px',
        maxDate : new Date(),

    },
    {
        name: "expId",
        label: "EXPENSES TYPE",
        type: "combobox",
        items: collections.expense || []
    },



    {
        name: "cashAmt",
        label: "CASH",
        type: "number",
    },

    {
        name: "bankAmt",
        label: "BANK",
        type: "number",
    },

    {
        name: "remarks",
        label: "REMARKS",
        type: "text",
    },
    {
        name: "bankId",
        label: "BANK ACCOUNT TYPE",
        type: "combobox",
        items: collections.bank || []
    },

    {
        name: "chequeNo",
        label: "CHEQUE NO",
        type: "text",
    },
];