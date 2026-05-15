import { axiosInstance } from "@/api/axiosInstance";
import { StoneMappingForm, StoneMappingFilter, StoneMapping } from "@/types/stoneMapping/StoneMappingTypes";
import { ApiResponse } from "@/types/api/apiResponse";


export const StoneMappingService = () => {

    const createStoneMapping = async (data: StoneMappingForm) => {
        try {
            const res = await axiosInstance.post("/stnamt", data);

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

    const updateStoneMapping = async (id: number, data: StoneMappingForm) => {
        try {
            console.log('updateHmc data:',id, data)
            const res = await axiosInstance.put(
                `/stnamt/${id}`,
                data
            );

            return res.data;
        } catch (error: any) {
            console.error("updateHmc error:", error);

            return error?.response?.data?.message ||
                "Failed to update HMC"
        }
    };

    const getStoneMappingData = async (filter?: string): Promise<ApiResponse<StoneMapping>> => {
        try {
            const res = await axiosInstance.get("/stnamt", {
                params: { filter },
            });

            console.log("getHmcData response:", res.data);

            return res.data;
        } catch (error: any) {
            console.error("getHmcData error:", error);

            return error?.response?.data?.message ||
                "Failed to fetch HMC data"
        }
    };

    const getStoneMappingById = async (id: number | null) => {
        try {
            const res = await axiosInstance.get(`/stnamt/${id}`);

            return res.data;
        } catch (error: any) {
            console.error("getHmcById error:", error);

            return error?.response?.data?.message ||
                "Failed to fetch HMC by ID"
        }
    };

    const getStoneMappingByFilter = async (filter: StoneMappingFilter) => {
        try {
            const res = await axiosInstance.post(
                "/stnamt/filter",
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
        createStoneMapping,
        updateStoneMapping,
        getStoneMappingData,
        getStoneMappingById,
        getStoneMappingByFilter,
    };
};