import { axiosInstance } from "@/api/axiosInstance";
import { HmcForm, HmcFilter } from "@/types/hmc/hmc";

export const HmcService = () => {

    const createHmc = async (data: HmcForm) => {
        return await axiosInstance.post("/hmc/create", data);
    };

    const updateHmc = async (id: number, data: HmcForm) => {
        return await axiosInstance.put(`/hmc/update/${id}`, data);
    };

    const getHmcData = async (filter?: string) => {
        return await axiosInstance.get("/hmc", {
            params: { filter },
        });
    };

    const getHmcById = async (id: number | null) => {
        return await axiosInstance.get(`/hmc/${id}`);
    };

    const getHmcByFilter = async (filter: HmcFilter) => {
        return await axiosInstance.post("/hmc/filter", filter);
    };

    return {
        createHmc,
        updateHmc,
        getHmcData,
        getHmcById,
        getHmcByFilter,
    };
};