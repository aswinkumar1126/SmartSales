import { axiosInstance } from "@/api/axiosInstance";
import { ApiResponse } from "@/types/api/apiResponse";
import { CashReportParams, CashReportResponse } from "@/types/report/CashReport";

export const CashReport = async (
    params: CashReportParams
): Promise<ApiResponse<CashReportResponse[]>> => {
    try {
        const response = await axiosInstance.get("/report/cash", {
            params, // ✅ send query params properly
        });

        return response.data;
    } catch (err) {
        console.log("error while fetching cash report", err);
        throw err; // ✅ important for react-query error handling
    }
};