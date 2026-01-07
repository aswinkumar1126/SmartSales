import { axiosInstance } from "@/api/axiosInstance";
import { ApiResponse } from "@/types/api/apiResponse";
import { TRANSACTION, CreateTransaction } from "@/types/transcation/Transaction";

const BASE_PATH = "/transaction";

export const TransactionService = {
    createMany: async (
        payload: CreateTransaction,
 
    ): Promise<ApiResponse<any>> => {
        try {
            console.log(payload ,'payloadfor create')
            const { data } = await axiosInstance.post(BASE_PATH ,payload);
            return data;
        } catch (error: any) {
            throw error?.response?.data || error;
        }
    },

    // GET ALL
    getAll: async (trantype: string): Promise<ApiResponse<any>> => {
        try {
            const { data } = await axiosInstance.get(BASE_PATH, {
                params: {trantype }, // 👈 case fixed
            });
            return data;
        } catch (error: any) {
            throw error?.response?.data || error;
        }
    },

    // GET BY TRANSACTION ID
    getByTransId: async (
        transId: string,
        TRANTYPE: string
    ): Promise<ApiResponse<any>> => {
        try {
            const { data } = await axiosInstance.get(BASE_PATH, {
                params: { transId, TRANTYPE },
            });
            return data;
        } catch (error: any) {
            throw error?.response?.data || error;
        }
    },

    // GET ONE
    getOne: async (
        sno: number,
        TRANTYPE: string
    ): Promise<ApiResponse<TRANSACTION>> => {
        try {
            const { data } = await axiosInstance.get(`${BASE_PATH}/${sno}`, {
                params: { TRANTYPE },
            });
            return data;
        } catch (error: any) {
            throw error?.response?.data || error;
        }
    },

    // UPDATE (PUT)
    update: async (
        sno: number,
        payload: TRANSACTION,
        TRANTYPE: string
    ): Promise<ApiResponse<TRANSACTION>> => {
        try {
            const { data } = await axiosInstance.put(
                `${BASE_PATH}/${sno}`,
                payload,
                {
                    params: { TRANTYPE },
                }
            );
            return data;
        } catch (error: any) {
            throw error?.response?.data || error;
        }
    },

    // PATCH
    patch: async (
        sno: number,
        payload: Partial<TRANSACTION>,
        TRANTYPE: string
    ): Promise<ApiResponse<TRANSACTION>> => {
        try {
            const { data } = await axiosInstance.patch(
                `${BASE_PATH}/${sno}`,
                payload,
                {
                    params: { TRANTYPE },
                }
            );
            return data;
        } catch (error: any) {
            throw error?.response?.data || error;
        }
    },

    // DELETE
    remove: async (
        sno: number,
        TRANTYPE: string
    ): Promise<ApiResponse<number>> => {
        try {
            const { data } = await axiosInstance.delete(`${BASE_PATH}/${sno}`, {
                params: { TRANTYPE },
            });
            return data;
        } catch (error: any) {
            throw error?.response?.data || error;
        }
    },
};
