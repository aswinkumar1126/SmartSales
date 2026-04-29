"use client";

import React,{useState ,useMemo} from "react";
import { useEnterNavigation } from "@/component/form/useEnterNavigation";
import { DynamicForm } from "@/component/form/DynamicForm";
import { getExpenseFields } from "@/config/transaction/ExpensesConfig";
import { useAllBankAccounts } from "@/hooks/apiHooks/bankAccount/useBankAccount";


function ExpensesPage(){

    const { data: bankAccounts, isLoading } = useAllBankAccounts();


   const banks = useMemo(() => {
           if (!bankAccounts) return [];
           if (Array.isArray(bankAccounts.data)) {
               return bankAccounts.data.map((b) => {
                   return {
                       label: b.BANKNAME, // fix typo
                       value: String(b.ENTRYNO),
                   };
               });
           }
           return [];
       }, [bankAccounts]);


    const expenseTypes = [
        {label:"Salary", value:"Salary"},
        {label:"Office Expense", value:"Office Expense"},
        {label:"Miscellaneous", value:"Miscellaneous"},
        {label:"Petrol", value:"Petrol"},

    ]


    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (data: any) => {
        console.log(data);
    };

    const expensiveForm = getExpenseFields({bank:banks, expense:expenseTypes});


    const getFormFields = expenseTypes.map(f=>f.name); 

    const { focusFirst, focusNext, register } = useEnterNavigation(getFormFields, handleSubmit);
    
    return (
        <div className="p-6">
            <DynamicForm 
                fields={expensiveForm} 
                focusNext={focusNext}
                register={register}
                

                errors={errors}
                layout="vertical"
            />
        </div>
    )

}

export default ExpensesPage;