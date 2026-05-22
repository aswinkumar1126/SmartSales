import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";

import { TransactionService, getBillWiseSales } from "@/service/ApprovalTransactionService";
import { CreateApprovalTransaction } from "@/types/transcation/ApprovalTransaction";
import { ApiResponse } from "@/types/api/apiResponse";
import { billNoParams } from "@/service/ApprovalTransactionService";
import { ApprovalTransactionList } from "@/types/transactionList/TransactionList";

/* -------------------- QUERY KEYS -------------------- */
export const transactionKeys = {
    all: ["approvalTransactions"] as const,
    list: (TRANTYPE: string) => [...transactionKeys.all, TRANTYPE] as const,
    byId: (sno: number, TRANTYPE: string) =>
        [...transactionKeys.all, "one", sno, TRANTYPE] as const,
    byTransId: (transId: string | null) =>
        [...transactionKeys.all, "transId", transId] as const,
};


/* -------------------- QUERIES -------------------- */

// GET ALL
export const useApprovalTransactions = (props: {
  
    trantype?: string | null;
    accode?: number | null;
    startdate?: string | null;
    enddate?: string | null;
    itemid?: number | null;
}) => {
    console.log("useTransaction called with props:", props);
    return useQuery<ApiResponse<ApprovalTransactionList>, Error, ApprovalTransactionList>({
        queryKey: [
            "approvalTransactions",
            "list",
            props.trantype ?? "all",
            props.accode ?? "all",
            props.startdate ?? "all",
            props.enddate ?? "all",
            props.itemid ?? "all",
        ],
        queryFn: () => TransactionService.getAll(props),
        select: (res) => res.data
    });
};

// GET BY TRANSACTION ID
export const useTransactionByTransId = (
    transId: string | null,
    TRANTYPE: string
) => {
    return useQuery<ApiResponse<any>>({
        queryKey: transactionKeys.byTransId(transId),
        queryFn: () =>
            TransactionService.getByTransId(transId),
        enabled: !!transId,
    });
};

// GET ONE
export const useTransaction = (
    sno: number,
    TRANTYPE: string,
) => {
    return useQuery<ApiResponse<any>>({
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
            entryNo,
            payload
        }: {
            entryNo: number;
            payload: CreateApprovalTransaction;
        }) => TransactionService.update(entryNo, payload),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: transactionKeys.all,
            });
        },
    });
};

// PATCH
export const usePatchTransaction = (TRANTYPE: string, tranType: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            sno,
            payload,
        }: {
            sno: number;
            payload: Partial<any>;
        }) => TransactionService.patch(sno, payload, TRANTYPE),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: transactionKeys.list(TRANTYPE),
            });
        },
    });
};

// DELETE
export const useDeleteTransaction = (TRANTYPE: string, tranType: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (sno: number) =>
            TransactionService.remove(sno, TRANTYPE, tranType),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: transactionKeys.list(TRANTYPE),
            });
        },
    });
};

//CREATE
//CREATE
export const useCreateTransactions = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ payload }: { payload: CreateApprovalTransaction }) =>
            TransactionService.createMany(payload),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: transactionKeys.all,
            });
        },
    });
};


export const useBillDetails = (params: billNoParams) => {
    return useQuery({
        queryKey: ['bill-details', params],
        queryFn: () => getBillWiseSales(params),
        enabled: true,
        staleTime: 1000 * 60 * 5, // optional: cache for 5 mins
        retry: 1,


    })
}