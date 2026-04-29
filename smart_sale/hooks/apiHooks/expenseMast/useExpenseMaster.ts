import { useApiQuery ,useApiMutation } from "../apiHook/ApiHook";
import { CreateExpenseMast ,Expense } from "@/types/expense/ExpenseMast";

const baseUrl = "expense/mast"

export const useAllExpenses = () => { return   useApiQuery<Expense[]>(
    {
        url:`${baseUrl}`,
        queryKey : ['expenseMast'],
        select :(response) => response.data,
        
    }
)
}

export const useExpenseById = (id: number) =>{
    return useApiQuery<Expense>(
        {
            url: `${baseUrl}/${id}`,
            queryKey: ['expenseMast', String(id)],
            select: (response) => response.data,
            enabled: !!id,

        }
    )
} 

export const useCreateExpenseNames = () => {
    return useApiMutation<CreateExpenseMast>({
    url:`${baseUrl}`,
    method:'POST',
    queryKey : ['expenseMast'],
    
})
}

export const useUpdateExpenseName = () => {
    
    return useApiMutation<CreateExpenseMast & {id: number} >(
    {
        url: ({id}) => `${baseUrl}/${id}`,
        method:'PUT',
        queryKey : ['expenseMast']
    }
)
}
