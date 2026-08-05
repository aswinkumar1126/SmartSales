import { useQuery ,useMutation ,useQueryClient } from "@tanstack/react-query";
import { createBankAccount ,getAllBankAccounts , updateBankAccount ,getBankAccount}  from "@/service/BankAccountMaster";
import { BankAccount } from "@/types/bankAccount/BankAccount";

export const useAllBankAccounts = (filter?:string, advancedFilter: Record<string, any> = {}) => {
    return useQuery({
        queryKey: ["bankAccounts" ,filter, advancedFilter],
        queryFn: () => getAllBankAccounts(filter, advancedFilter),
    });
};

export const useCreateBankAccount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: BankAccount) => createBankAccount(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bankAccounts"] });

        },
    });
};

export const useBankAccount = (ENTRYNO:number|null) =>{
    return  useQuery({
        queryKey: ["bankAccount"],
        queryFn: () => getBankAccount(ENTRYNO),
        enabled: !!ENTRYNO,
    })
}
export const useUpdatebankAccount = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ ENTRYNO, payload }: { ENTRYNO: number; payload: BankAccount }) =>
            updateBankAccount(ENTRYNO, payload),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bankAccounts"] });
        },
    });
};
