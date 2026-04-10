// hooks/issue/useIssue.ts

import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { IssueService } from "@/service/IssueService";
import { ISSUE } from "@/types/issue/issue";

// 🔹 Query Keys
const ISSUE_KEYS = {
    all: ["issue"] as const,
    detail: (sno: number) => ["issue", sno] as const,
};

// ---------- GET ALL ----------
export const useIssues = () =>
    useQuery({
        queryKey: ISSUE_KEYS.all,
        queryFn: IssueService.getAll,
        select: (res) => res.data,
    });

// ---------- GET ONE ----------
export const useIssue = (sno: number) =>
    useQuery({
        queryKey: ISSUE_KEYS.detail(sno),
        queryFn: () => IssueService.getOne(sno),
        enabled: !!sno,
        select: (res) => res.data,
    });

// ---------- CREATE ----------
export const useCreateIssue = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: IssueService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ISSUE_KEYS.all });
        },
    });
};

// ---------- UPDATE ----------
export const useUpdateIssue = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            sno,
            payload,
        }: {
            sno: number;
            payload: ISSUE;
        }) => IssueService.update(sno, payload),

        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ISSUE_KEYS.all });
            queryClient.invalidateQueries({
                queryKey: ISSUE_KEYS.detail(variables.sno),
            });
        },
    });
};

// ---------- PATCH ----------
export const usePatchIssue = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            sno,
            payload,
        }: {
            sno: number;
            payload: Partial<ISSUE>;
            }) => IssueService.update(sno, payload),

        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ISSUE_KEYS.all });
            queryClient.invalidateQueries({
                queryKey: ISSUE_KEYS.detail(variables.sno),
            });
        },
    });
};

// ---------- DELETE ----------
export const useDeleteIssue = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: IssueService.remove,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ISSUE_KEYS.all });
        },
    });
};
