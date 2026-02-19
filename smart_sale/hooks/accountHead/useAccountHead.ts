import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getAllAccountHead,
    createAccountHead,
    updateAccountHead,
    deleteAccountHead,
    getAccountHeadById,
} from "@/service/AccountHead";
import { AccountHead } from "@/types/accountHead/AccountHead";
import { toastUpdated , toastCreated ,toastDeleted, toastError } from "@/component/toast/toast";

/* -------------------- Queries -------------------- */

export const useAllAccountHead = (filter?: string, filters: any = {}) => {
    return useQuery({
        queryKey: ["accountHead", filters , filter], // cache per filter set
        queryFn: () => getAllAccountHead(filter, filters),
    });
};

export const useAccountHeadById = (id?: number) => {
    return useQuery({
        queryKey: ["accountHead", id],
        queryFn: () => getAccountHeadById(id!),
        enabled: !!id,
    });
};

/* -------------------- Mutations -------------------- */

export const useCreateAccountHead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: AccountHead) => createAccountHead(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["accountHead"] });
            toastCreated("Account Head")

        },
        onError:()=>toastError("Account Head")
    });
};

export const useUpdateAccountHead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: AccountHead }) =>
            updateAccountHead(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["accountHead"] });
            toastUpdated("Account Head")
        },
    });
};

export const useDeleteAccountHead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => deleteAccountHead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["accountHead"] });
        },
    });
};
