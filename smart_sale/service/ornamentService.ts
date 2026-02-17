import { axiosInstance } from "@/api/axiosInstance";
import { OrnamentPayload, ApiResponse } from "@/types/ornament/ornament";

export const getOrnamentList = async (filter?:string) => {
    const response = await axiosInstance.get("/ornament",{
        params: filter ? { filter: filter } : undefined,
    });
    return response.data;
};

export const getOrnamentById = async (sno: number) => {
    const response = await axiosInstance.get(`/ornament/${sno}`);
    return response.data;
};

export const createOrnament = async (
    payload: OrnamentPayload
): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post("/ornament", payload);
    return response.data;
};

export const updateOrnament = async (
    sno: number,
    payload: OrnamentPayload
) => {
    const response = await axiosInstance.put(`/ornament/${sno}`, payload);
    return response.data;
};

export const deleteOrnament = async (id: number) => {
    const response = await axiosInstance.delete(`/ornaments/${id}`);
    return response.data;
};
