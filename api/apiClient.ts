// apiClient.ts
import { axiosInstance } from "./axiosInstance";

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

export interface ApiOptions<T> {
    method: HttpMethod;
    url: string;
    data?: T;
    params?: Record<string, any>;
    headers?: Record<string, string>;
    isFormData?: boolean;
}

export interface ApiError {
    status: "error";
    message: string;
    errors?: any;
}

export const callApi = async <T, R>({
    method,
    url,
    data,
    params,
    headers = {},
    isFormData = false,
}: ApiOptions<T>): Promise<R> => {
    try {

       
        const response = await axiosInstance.request<R>({
            method,
            url,
            params,
            data,
            headers: {
                ...headers,
                ...(isFormData ? { "Content-Type": "multipart/form-data" } : {}),
            },
        });

        return response.data;
    } catch (error: any) {
        console.error(`❌ API Error [${method.toUpperCase()}] ${url}`, error);

        throw {
            status: "error",
            message:
                error?.response?.data?.message ||
                error?.message ||
                "Something went wrong",
            errors: error?.response?.data?.errors,
        } as ApiError;
    }
};
