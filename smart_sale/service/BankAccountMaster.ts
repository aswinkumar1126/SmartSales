import { axiosInstance } from "@/api/axiosInstance";
import { ApiResponse } from "@/types/api/apiResponse";
import { BankAccount } from "@/types/bankAccount/BankAccount";
const base = 'bankaccountmaster'

export const createBankAccount = async(payload:BankAccount)=>{
    try{
        const response = await axiosInstance.post(`${base}`,payload);
        return response.data;
    }
    catch(error){
        throw error;
    }
}

export const getAllBankAccounts = async():Promise<ApiResponse<any>>=>{
    try{
        const response = await axiosInstance.get(`${base}`);
        return response.data;
    }
    catch(error){
        throw error;
    }
}

export const getBankAccount = async (ENTRYNO:number|null): Promise<ApiResponse<any>> => {
    try {
        const response = await axiosInstance.get(`${base}/${ENTRYNO}`);
        return response.data;
    }
    catch (error) {
        throw error;
    }
}

export const updateBankAccount = async (ENTRYNO:number , payload:BankAccount): Promise<ApiResponse<any>> => {
    try {
        const response = await axiosInstance.put(`${base}/${ENTRYNO}`,payload);
        return response.data;
    }
    catch (error) {
        throw error;
    }
}
