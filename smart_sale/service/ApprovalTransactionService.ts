import { axiosInstance } from "@/api/axiosInstance";
import { AxiosError } from "axios";
import { ApiResponse } from "@/types/api/apiResponse";
import { TRANSACTION, CreateApprovalTransaction } from "@/types/transcation/ApprovalTransaction";
import { getSingleTagDetail } from "@/types/tagging/Tag";
import { ApprovalTransactionList } from "@/types/transactionList/TransactionList";

type GetTransactionProps = {

    trantype?: string | null;
    accode?: number | null;
    startdate?: string | null;
    enddate?: string | null;
    itemid?: number | null;
 
}

export interface billNoParams {
    ACCODE?: number;
    ENTRYNO?: number;
    TRANDATE?: string;
    TAGNO?:string;
}

const BASE_PATH = "approval"


export const TransactionService = {
    createMany: async (
        payload: CreateApprovalTransaction
 
    ): Promise<ApiResponse<any>> => {
        try {
            
           
            const { data } = await axiosInstance.post(BASE_PATH ,payload);
            console.log(data, 'datatransaction')
            return data;
        } catch (error: any) {
            throw error?.response?.data || error;
        }
    },

    // GET ALL
    getAll: async (props: GetTransactionProps): Promise<ApiResponse<ApprovalTransactionList>> => {
        try {
            const params: any = {};

            if (props.trantype) params.trantype = props.trantype;
            if (props.accode) params.accode = props.accode;
            if (props.startdate) params.startdate = props.startdate;
            if (props.enddate) params.enddate = props.enddate;
            if (props.itemid) params.itemid = props.itemid;

            

            const {data} = await axiosInstance.get(BASE_PATH, { params });
            return data ;
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
           
            return data;
        } catch (error: any) {
            throw error?.response?.data || error;
        }
    },

    // GET ONE
    getOne: async (
        sno: number,
        TRANTYPE: string,
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
        entryNo: number,
        payload: CreateApprovalTransaction,
      
        
    ): Promise<ApiResponse<any>> => {
       
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
        TRANTYPE: string,
        tranType:string
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



export const getIssueWiseApproval = async (params: billNoParams) => {
    try {
        console.log(params,'paramforsales')
        const queryParams: any = {};

        if (params.ACCODE !== undefined) {
            queryParams.ACCODE = params.ACCODE;
        }

        if (params.ENTRYNO) {
            queryParams.ENTRYNO = params.ENTRYNO;
        }
        if(params.TAGNO){
            queryParams.TAGNO = params.TAGNO;
        }

        if (params.TRANDATE) {
            queryParams.TRANDATE = params.TRANDATE;
        }

        const response = await axiosInstance.get<ApiResponse<getSingleTagDetail[]>>(
            `${BASE_PATH}/remaining`,
            { params: queryParams } // ✅ send only filtered params
        );
        console.log(response.data, 'responsegettag')

        return response?.data?.data;
    } catch (err) {
        if (err instanceof AxiosError) {
            return {
                error: err.response?.data.message || "Failed to Fetch",
                status: err.response?.status,
            };
        } else if (err instanceof Error) {
            return { error: err.message };
        } else {
            return { error: "Unknown error occurred" };
        }
    }
};