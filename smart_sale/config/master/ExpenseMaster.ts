import { FormField } from "@/types/form/form";

type expenseParams ={
    label:string , value : string
}

export const getExpenseMasterFields = (active:expenseParams[]):FormField[] => [
    
    {
        name: "expName",
        label: "EXPENSE NAME",
        type: "text",
        required:true,
        minWidth: '150px',
        rounded:'sm'
    },
    {
        name: "active",
        label: "ACTIVE",
        type: "select",
        items: active ,
        minWidth : '80px'
    },

];