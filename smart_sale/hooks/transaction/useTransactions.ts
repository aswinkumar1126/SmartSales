import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";

import { TransactionService } from "@/service/TransactionService";
import { CreateTransaction, TRANSACTION } from "@/types/transcation/Transaction";
import { ApiResponse } from "@/types/api/apiResponse";

/* -------------------- QUERY KEYS -------------------- */
export const transactionKeys = {
    all: ["transactions"] as const,
    list: (TRANTYPE: string) => [...transactionKeys.all, TRANTYPE] as const,
    byId: (sno: number, TRANTYPE: string) =>
        [...transactionKeys.all, "one", sno, TRANTYPE] as const,
    byTransId: (transId: string, TRANTYPE: string) =>
        [...transactionKeys.all, "transId", transId, TRANTYPE] as const,
};

/* -------------------- QUERIES -------------------- */

// GET ALL
export const useTransactions = (
    trantype: string,
    accode?: number,
    startdate?: string,
    enddate?: string
) => {
    return useQuery<ApiResponse<any>>({
        queryKey: transactionKeys.list(trantype),
        queryFn: () => TransactionService.getAll(trantype, accode, startdate, enddate),
     
    });
};


// GET BY TRANSACTION ID
export const useTransactionByTransId = (
    transId: string,
    TRANTYPE: string
) => {
    return useQuery<ApiResponse<any>>({
        queryKey: transactionKeys.byTransId(transId, TRANTYPE),
        queryFn: () =>
            TransactionService.getByTransId(transId, TRANTYPE),
        enabled: !!transId && !!TRANTYPE,
    });
};

// GET ONE
export const useTransaction = (
    sno: number,
    TRANTYPE: string
) => {
    return useQuery<ApiResponse<TRANSACTION>>({
        queryKey: transactionKeys.byId(sno, TRANTYPE),
        queryFn: () => TransactionService.getOne(sno, TRANTYPE),
        enabled: !!sno && !!TRANTYPE,
    });
};

/* -------------------- MUTATIONS -------------------- */


// UPDATE (PUT)
export const useUpdateTransaction = (TRANTYPE: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            sno,
            payload,
        }: {
            sno: number;
            payload: TRANSACTION;
        }) => TransactionService.update(sno, payload, TRANTYPE),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: transactionKeys.list(TRANTYPE),
            });
        },
    });
};

// PATCH
export const usePatchTransaction = (TRANTYPE: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            sno,
            payload,
        }: {
            sno: number;
            payload: Partial<TRANSACTION>;
        }) => TransactionService.patch(sno, payload, TRANTYPE),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: transactionKeys.list(TRANTYPE),
            });
        },
    });
};

// DELETE
export const useDeleteTransaction = (TRANTYPE: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (sno: number) =>
            TransactionService.remove(sno, TRANTYPE),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: transactionKeys.list(TRANTYPE),
            });
        },
    });
};

//CREATE
export const useCreateTransactions = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateTransaction) =>
            TransactionService.createMany(payload),

        onSuccess: () => {
            // Refresh transaction list for this TRANTYPE
            queryClient.invalidateQueries({
                queryKey: transactionKeys.all,
                
            });
        },
    });
};