import { axiosInstance } from "@/api/axiosInstance";
import { HmcForm, HmcFilter ,Hmc } from "@/types/hmc/hmc";
import { ApiResponse } from "@/types/api/apiResponse";

export const HmcService = () => {

    const createHmc = async (data: HmcForm) => {
        try {
            const res = await axiosInstance.post("/hmc", data);

            return res.data;
        } catch (error: any) {
            console.error("createHmc error:", error);

            return {
                success: false,
                data: null,
                message:
                    error?.response?.data?.message ||
                    "Failed to create HMC",
            };
        }
    };

    const updateHmc = async (id: number, data: HmcForm) => {
        try {
            console.log('updateHmc data:',id, data)
            const res = await axiosInstance.put(
                `/hmc/${id}`,
                data
            );

            return res.data;
        } catch (error: any) {
            console.error("updateHmc error:", error);

            return error?.response?.data?.message ||
                "Failed to update HMC"
        }
    };

    const getHmcData = async (filter?: string, advancedFilter?: Record<string, any>) :Promise <ApiResponse<Hmc>> => {
        try {
            const res = await axiosInstance.get("/hmc", {
                params: {
                    ...(filter ? { filter } : {}),
                    ...advancedFilter,
                },
            });

            console.log("getHmcData response:", res.data)

            return res.data;
        } catch (error: any) {
            console.error("getHmcData error:", error);

            return error?.response?.data?.message ||
                "Failed to fetch HMC data"
        }
    };

    const getHmcById = async (id: number | null) => {
        try {
            const res = await axiosInstance.get(`/hmc/${id}`);

            return res.data;
        } catch (error: any) {
            console.error("getHmcById error:", error);

            return error?.response?.data?.message ||
                "Failed to fetch HMC by ID"
        }
    };

    const getHmcByFilter = async (filter: HmcFilter) => {
        try {
            const res = await axiosInstance.post(
                "/hmc/filter",
                filter
            );

            return res.data;
        } catch (error: any) {
            console.error("getHmcByFilter error:", error);

            return error?.response?.data?.message ||
                "Failed to fetch filtered HMC data"
        }
    };

    return {
        createHmc,
        updateHmc,
        getHmcData,
        getHmcById,
        getHmcByFilter,
    };
};