import { axiosInstance } from "@/api/axiosInstance";
import { OrnamentPayload, ApiResponse } from "@/types/ornament/ornament";

export const getOrnamentList = async (filter?: string, stockType?:'T'|'N',entryNo?:number ,tranType?:"PU"|"SA", advancedFilter?: Record<string, any>) => {
    const response = await axiosInstance.get("/ornament",{
        params: {
            FILTER: filter,
            ...(stockType ? { STOCKTYPE: stockType } : {}),
            ...(entryNo ? {ENTRYNO :entryNo}:{}),
            ...(tranType ? { TRANTYPE: tranType } :{}),
            ...advancedFilter,

        },
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
