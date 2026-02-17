import { axiosInstance } from "@/api/axiosInstance";
import { ApiResponse } from "@/types/api/apiResponse";
import { TRANSACTION, CreateTransaction,  UpdateTransactionPayload } from "@/types/transcation/Transaction";

const BASE_PATH = "/purchase";

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
    getAll: async (
        trantype?: undefined | null | string,
        accode?: number | null,
        startdate?: string | null,
        enddate?: string | null,
        itemid?: number | null,
    ): Promise<ApiResponse<any>> => {
        try {
            const params: any = {};
            

            if (trantype) params.trantype = trantype;
            if (accode) params.accode = accode;
            if (startdate) params.startdate = startdate;
            if (enddate) params.enddate = enddate;
            if(itemid) params.itemid=itemid;


            const { data } = await axiosInstance.get(BASE_PATH, { params });
            return data;
        } catch (error: any) {
            throw error?.response?.data || error;
        }
    },
    // GET BY TRANSACTION ID
    getByTransId: async (
        transId: string | null,
    ): Promise<ApiResponse<any>> => {
        try {
            const { data } = await axiosInstance.get(`${BASE_PATH}/${transId}`);
            console.log(data ,'transactionss')
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
        sno: string,
        payload: CreateTransaction,
    ): Promise<ApiResponse<any>> => {

        console.log(sno,'updating sno')
        try {
            const { data } = await axiosInstance.put(
                `${BASE_PATH}/${sno}`,
                payload,
            );
            console.log(data, 'resultData')
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

