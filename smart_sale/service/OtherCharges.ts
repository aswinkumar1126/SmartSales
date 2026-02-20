import { OtherChargeForm } from "@/types/others/OtherCharges";
import { ApiResponse } from "@/types/api/apiResponse";
import { axiosInstance } from "@/api/axiosInstance";

export const createOtherCharges = async(data:OtherChargeForm):Promise<ApiResponse<OtherChargeForm>> => {
    try{
        console.log(data,'service')
        const response = await axiosInstance.post('/othercharges',data);
        
        return response.data;
    }
    catch(error){
        console.error(error);
        throw error;
    }
}
export const getAllOtherCharges = async (filter?:string): Promise<ApiResponse<OtherChargeForm[]>> => {
    try {
        const response = await axiosInstance.get('/othercharges',{
            params : filter? filter = filter :undefined
        });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
export const updateOtherCharges = async (id: number, data: OtherChargeForm): Promise<ApiResponse<OtherChargeForm>> => {
    try {
        const response = await axiosInstance.put(`/othercharges/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
export const deleteOtherCharges = async (id: number): Promise<ApiResponse<OtherChargeForm>> => {
    try {
        const response = await axiosInstance.delete(`/othercharges/${id}`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
export const getOtherChargeById = async (id: number): Promise<ApiResponse<OtherChargeForm>> => {
    try {
        const response = await axiosInstance.get(`/othercharge/${id}`);
        return response.data;
    }
    catch (error) {
        console.error(error);
        throw error;
    }
}
