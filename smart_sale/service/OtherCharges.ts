import { OtherChargeForm } from "@/types/others/OtherCharges";
import { ApiResponse } from "@/types/api/apiResponse";
import { axiosInstance } from "@/api/axiosInstance";

export const createOtherCharges = async(data:OtherChargeForm):Promise<ApiResponse<OtherChargeForm>> => {
    try{
        const response = await axiosInstance.post('/othercharge',data);
        return response.data;
    }
    catch(error){
        console.error(error);
        throw error;
    }
}
export const getAllOtherCharges = async (): Promise<ApiResponse<OtherChargeForm[]>> => {
    try {
        const response = await axiosInstance.get('/othercharge');
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
export const updateOtherCharges = async (id: number, data: OtherChargeForm): Promise<ApiResponse<OtherChargeForm>> => {
    try {
        const response = await axiosInstance.put(`/othercharge/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
export const deleteOtherCharges = async (id: number): Promise<ApiResponse<OtherChargeForm>> => {
    try {
        const response = await axiosInstance.delete(`/othercharge/${id}`);
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
