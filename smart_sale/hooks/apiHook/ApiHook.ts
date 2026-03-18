import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/api/axiosInstance";
import { ApiResponse } from "@/types/api/apiResponse";

// Generic API hook options with all React Query features
type ApiHookOptions<TData = any, TParams = any, TBody = any> = {
    url: string | ((variables: TBody) => string); // allow function
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    params?: TParams;
    queryKey?: string[];
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
    refetchOnWindowFocus?: boolean;
    refetchOnMount?: boolean;
    refetchOnReconnect?: boolean;
    retry?: boolean | number;
    retryDelay?: number | ((attemptIndex: number) => number);
    select?: (response: ApiResponse<TData>) => any;
    onSuccess?: (data: ApiResponse<TData>) => void;
    onError?: (error: Error) => void;
    onSettled?: (data?: ApiResponse<TData>, error?: Error) => void;
    onMutate?: (variables: TBody) => Promise<any> | any;
};

// -------------------- QUERY --------------------
export const useApiQuery = <
    TData = any,
    TParams = any,
    TSelected = TData
>({
    url,
    params,
    queryKey,
    enabled = true,
    staleTime,
    gcTime,
    refetchOnWindowFocus,
    refetchOnMount,
    refetchOnReconnect,
    retry,
    retryDelay,
    select,
    onSuccess,
    onError,
    onSettled,
}: ApiHookOptions<TData, TParams, any> & { select?: (data: ApiResponse<TData>) => TSelected }) => {
    
    console.log(url,'urlurl')
    return useQuery<ApiResponse<TData>, Error, TSelected>({
        queryKey: queryKey || [url, params],
        queryFn: async () => {
            // Resolve dynamic URL if it's a function
      
            const resolvedUrl = typeof url === "function" ? url(params as any) : url;
            console.log(resolvedUrl,'resolvedUrl')
               
            const res = await axiosInstance.get<ApiResponse<TData>>(resolvedUrl, { params });
            return res.data;
        },
        enabled,
        staleTime,
        gcTime,
        refetchOnWindowFocus,
        refetchOnMount,
        refetchOnReconnect,
        retry,
        retryDelay,
        select,
        meta: { onSuccess, onError, onSettled },
    });
};

// -------------------- MUTATION --------------------
export const useApiMutation = <TData = any, TBody = any, TParams = any>({
    url,
    method = "POST",
    params,
    queryKey,
    onSuccess,
    onError,
    onSettled,
    onMutate,
    
}: ApiHookOptions<TData, TParams, TBody>) => {
    const queryClient = useQueryClient();

    return useMutation<ApiResponse<TData>, Error, TBody>({
        mutationFn: async (variables: TBody) => {
            const resolvedUrl = typeof url === "function" ? url(variables) : url;

            const res = await axiosInstance.request<ApiResponse<TData>>({
                url: resolvedUrl,
                method,
                params,
                data: variables,
            });

            return res.data;
        },
        onMutate: async (variables) => {
            if (queryKey) await queryClient.cancelQueries({ queryKey });
            if (onMutate) return await onMutate(variables);
        },
        onSuccess: (data) => {
            if (queryKey) queryClient.invalidateQueries({ queryKey });
            if (onSuccess) onSuccess(data);
        },
        onError: (error, variables) => {
            if (onError) onError(error);
        },
        onSettled: (data) => {
            if (onSettled) onSettled(data);
        },
    });
};