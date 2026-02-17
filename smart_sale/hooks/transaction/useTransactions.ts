import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";

import { TransactionService } from "@/service/TransactionService";
import { CreateTransaction, TRANSACTION, UpdateTransactionPayload } from "@/types/transcation/Transaction";
import { ApiResponse } from "@/types/api/apiResponse";

/* -------------------- QUERY KEYS -------------------- */
export const transactionKeys = {
    all: ["transactions"] as const,
    list: (TRANTYPE: string) => [...transactionKeys.all, TRANTYPE] as const,
    byId: (sno: number, TRANTYPE: string) =>
        [...transactionKeys.all, "one", sno, TRANTYPE] as const,
    byTransId: (transId: string|null) =>
        [...transactionKeys.all, "transId", transId] as const,
};

/* -------------------- QUERIES -------------------- */

// GET ALL
export const useTransactions = (
    trantype?: undefined | null | string,
    accode?: number | null,
    startdate?: string | null,
    enddate?: string | null,
    itemid?:number | null,
    
) => {
    return useQuery<ApiResponse<any>>({
        queryKey: [
            "transactions",
            "list",
            trantype ?? "all",
            accode ?? "all",
            startdate ?? "all",
            enddate ?? "all",
            itemid ?? "all",
        ],
        queryFn: () => TransactionService.getAll(trantype, accode, startdate, enddate , itemid),
        
      
    });
};

// GET BY TRANSACTION ID
export const useTransactionByTransId = (
    transId: string | null,
) => {
    return useQuery<ApiResponse<any>>({
        queryKey: transactionKeys.byTransId(transId),
        queryFn: () =>
            TransactionService.getByTransId(transId),
        enabled: !!transId ,
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
export const useUpdateTransaction = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            sno,
            payload,
        }: {
            sno: string;
            payload: CreateTransaction;
        }) => TransactionService.update(sno, payload),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: transactionKeys.all,
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