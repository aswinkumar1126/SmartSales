import { useApiQuery ,useApiMutation } from "../apiHook/ApiHook";
import { ExpenseOpeningCreateRequest ,ExpenseOpeningResponse  } from "@/types/expense/ExpenseOpening";
import { ApiResponse } from "@/types/api/apiResponse";

const baseUrl = "expense/open"

export const useExpenseCreate = () => {
    return useApiMutation<ExpenseOpeningCreateRequest>({
        url:`${baseUrl}`,
        method:'POST',
        queryKey : ['expenseOpening'],
        
    })
}

export const useExpenseUpdate = () => {
    return useApiMutation<ExpenseOpeningCreateRequest & {entryNo: number} >(
        {
            url: ({entryNo}) => `${baseUrl}/${entryNo}`,
            method:'PUT',
            queryKey : ['expenseOpening']
        }
    )
}

export const useGetAllExpenses = () => { 
    return useApiQuery<ApiResponse<ExpenseOpeningResponse[]>>(
        {
            url:`${baseUrl}`,
            queryKey : ['expenseOpening'], 
        }
    )
} 

export const useGetExpenseById = (id: number) => {
    return useApiQuery<ApiResponse<ExpenseOpeningResponse>>(
        {
            url: `${baseUrl}/${id}`,
            queryKey: ['expenseOpening', String(id)],
            enabled: !!id,

        }
    )
}

export const useDeleteExpense = () => {
    return useApiMutation<{entryNo: number}, {entryNo: number} >(
        {
            url: ({entryNo}) => `${baseUrl}/${entryNo}`,
            method:'DELETE',
            queryKey : ['expenseOpening']
        }
    )
}