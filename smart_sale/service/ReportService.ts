import { axiosInstance } from "@/api/axiosInstance";
import { ApiResponse } from "@/types/api/apiResponse";
import {
    PaymentReportParams,
    PaymentReportResponse,
} from "@/types/report/PaymentReport";

export const PaymentReport = async (
    params: PaymentReportParams
): Promise<ApiResponse<PaymentReportResponse>> => {
    try {
        console.log("params", params);

        // ✅ avoid mutating original params
        const requestParams =
            params.PAYMODE === "CASH"
                ? (() => {
                    const { BANKID, ...rest } = params;
                    return rest;
                })()
                : params;

        const response = await axiosInstance.get("/report/payment", {
            params: requestParams,
        });

        return response.data;
    } catch (err) {
        console.log("error while fetching payment report", err);
        throw err;
    }
};