import { axiosInstance } from "@/api/axiosInstance";
import { ApiResponse } from "@/types/api/apiResponse";
import { TRANSACTION, CreateTransaction,  UpdateTransactionPayload } from "@/types/transcation/Transaction";

const BASE_PURCHASE_PATH = "/purchase" ;
const BASE_SALES_PATH = "/sales";


type GetTransactionProps = {

    TRANTYPE: string;
    trantype?: string | null;
    accode?: number | null;
    startdate?: string | null;
    enddate?: string | null;
    itemid?: number | null;
 
}

export const TransactionService = {
    createMany: async (
        payload: CreateTransaction,
        TRANTYPE: string
 
    ): Promise<ApiResponse<any>> => {
        try {
            
            const BASE_PATH =
                TRANTYPE === "purchase" 
                    ? BASE_PURCHASE_PATH
                    : BASE_SALES_PATH;
            const { data } = await axiosInstance.post(BASE_PATH ,payload);
            console.log(data, 'datatransaction')
            return data;
        } catch (error: any) {
            throw error?.response?.data || error;
        }
    },

    // GET ALL
    getAll: async (props: GetTransactionProps): Promise<ApiResponse<any>> => {
        try {
            const params: any = {};

            if (props.trantype) params.trantype = props.trantype;
            if (props.accode) params.accode = props.accode;
            if (props.startdate) params.startdate = props.startdate;
            if (props.enddate) params.enddate = props.enddate;
            if (props.itemid) params.itemid = props.itemid;

            const BASE_PATH = props.TRANTYPE === "purchase"
                ? BASE_PURCHASE_PATH
                : BASE_SALES_PATH;

            const { data } = await axiosInstance.get(BASE_PATH, { params });
            return data;
        } catch (error: any) {
            throw error?.response?.data || error;
        }
    },
    // GET BY TRANSACTION ID
    getByTransId: async (
        transId: string | null,
        TRANTYPE: string
    ): Promise<ApiResponse<any>> => {
        try {
            const BASE_PATH =
                TRANTYPE === "purchase"
                    ? BASE_PURCHASE_PATH
                    : BASE_SALES_PATH;

            const { data } = await axiosInstance.get(`${BASE_PATH}/${transId}`);
           
            return data;
        } catch (error: any) {
            throw error?.response?.data || error;
        }
    },

    // GET ONE
    getOne: async (
        sno: number,
        TRANTYPE: string,
        tranType:string
    ): Promise<ApiResponse<TRANSACTION>> => {
        try {
            const BASE_PATH =
                tranType === "purchase"
                    ? BASE_PURCHASE_PATH
                    : BASE_SALES_PATH;
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
        entryNo: number,
        payload: CreateTransaction,
        TRANTYPE: string
        
    ): Promise<ApiResponse<any>> => {
        const BASE_PATH =
            TRANTYPE === "purchase"
                ? BASE_PURCHASE_PATH
                : BASE_SALES_PATH;
        try {
            const { data } = await axiosInstance.put(
                `${BASE_PATH}/${entryNo}`,
                payload,
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
        TRANTYPE: string,
        tranType:string
    ): Promise<ApiResponse<TRANSACTION>> => {
        const BASE_PATH =
            tranType === "purchase"
                ? BASE_PURCHASE_PATH
                : BASE_SALES_PATH;
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
        TRANTYPE: string,
        tranType:string
    ): Promise<ApiResponse<number>> => {
        const BASE_PATH =
            tranType === "purchase"
                ? BASE_PURCHASE_PATH
                : BASE_SALES_PATH;
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

