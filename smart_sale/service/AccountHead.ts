import { axiosInstance } from "@/api/axiosInstance";
import { ApiResponse } from "@/types/api/apiResponse";
import { AccountHead, AccountHeadCollection } from "@/types/accountHead/AccountHead";

export const getAllAccountHead = async (filter?: string, accountFilter?: any): Promise<ApiResponse<AccountHeadCollection>> => {

    console.log(filter , accountFilter ,'filters') 
    try{
        const respose = await axiosInstance.get('/achead',{
            params:{
                filter ,
                ...accountFilter,
            }
        });
        return respose.data;
    }
    catch(error){
        console.error(error);
        throw error;
    }

}  
export const createAccountHead = async(data:AccountHead):Promise<ApiResponse<AccountHead>> => {
    console.log(data,'posting data')
    try{
        const response = await axiosInstance.post('/achead',data);
        return response.data;
    }
    catch(error){
        console.error(error);
        throw error;
     
    }
}
export const updateAccountHead = async(id:number,data:AccountHead):Promise<ApiResponse<AccountHead>> => {
    try{
        
        const response = await axiosInstance.put(`/achead/${id}`,data);
      
        return response.data;
    }
    catch(error){
        console.error(error);
        throw error;
    }
}
export const deleteAccountHead = async(id:number):Promise<ApiResponse<AccountHead>> => {
    try{
        const response = await axiosInstance.delete(`/achead/${id}`);
        return response.data;
    }
    catch(error){
        console.error(error);
        throw error;
    }
}
export const getAccountHeadById = async(id:number):Promise<ApiResponse<AccountHead>> => {
    try{
        const response = await axiosInstance.get(`/achead/${id}`);
        return response.data;
    }
    catch(error){
        console.error(error);
        throw error;
    }
}
