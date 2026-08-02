import { useQuery , useMutation ,useQueryClient } from "@tanstack/react-query";
import { getAllAccounts ,getAccountById ,updateAccountById ,deleteAccountById ,createAccountById } from "@/service/AccountService";
import { AccountForm } from "@/types/account/Account";

export const useAccount = () => {
    return useQuery({
        queryKey: ['accounts'],
        queryFn: getAllAccounts,
    });
}

export const useAccountById = (id: number) => {
    return useQuery({
        queryKey: ['accounts', id],
        queryFn: () => getAccountById(id),
        enabled: !id
    });
}

export const useCreateAccount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createAccountById,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
}

export const useUpdateAccount = () =>{
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({id , payload}:{id:number , payload:AccountForm}) => updateAccountById(id , payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        }
    });
}

export const useDeleteAccount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteAccountById,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
}