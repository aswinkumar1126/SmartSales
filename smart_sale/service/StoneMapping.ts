import { axiosInstance } from "@/api/axiosInstance";
import { StoneMappingForm, StoneMappingFilter, StoneMapping } from "@/types/stoneMapping/StoneMappingTypes";
import { ApiResponse } from "@/types/api/apiResponse";


export const StoneMappingService = () => {

    const createStoneMapping = async (data: StoneMappingForm) => {
        try {
            const res = await axiosInstance.post("/stnamt", data);

            return res.data;
        } catch (error: any) {
            if (error.response) {
                // Server responded with error
                console.error("API ERROR:");
                console.error("Status:", error.response.status);
                console.error("Data:", error.response.data);
                console.error("Headers:", error.response.headers);
            } else if (error.request) {
                // Request sent but no response
                console.error("NO RESPONSE:", error.request);
            } else {
                // Other axios error
                console.error("AXIOS ERROR:", error.message);
            }
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

    const getStoneMappingData = async (filter?: string, advancedFilter?: Record<string, any>): Promise<ApiResponse<StoneMapping>> => {
        try {
            const res = await axiosInstance.get("/stnamt", {
                params: {
                    ...(filter ? { filter } : {}),
                    ...advancedFilter,
                },
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