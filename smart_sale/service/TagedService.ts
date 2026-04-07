import { axiosInstance } from "@/api/axiosInstance";
import { ApiResponse } from "@/types/api/apiResponse";
import { getSingleTagDetail } from "@/types/tagging/Tag";
import { AxiosError } from "axios";

export interface TagDetailsResult {
    data?: getSingleTagDetail;
    error?: string; // human-readable error message
    status?: number; // HTTP status code if available
}

// ✅ Service that returns either data or error
export const getTagDetails = async (
    tagNo: string,
    ACCODE: number,
    ISSALE:boolean
): Promise<TagDetailsResult> => {
    try {
        const response = await axiosInstance.get<ApiResponse<getSingleTagDetail>>(
            `/tagged/singleTag/${tagNo}`,
            { params: { ACCODE, ISSALE } }
        );

        return { data: response.data.data }; // ✅ only return actual data
    } catch (err) {
        if (err instanceof AxiosError) {
            return {
                error: err.response?.data.message || "Failed to Fetch",
                status: err.response?.status,
            };
        } else if (err instanceof Error) {
            return { error: err.message };
        } else {
            return { error: "Unknown error occurred" };
        }
    }
};