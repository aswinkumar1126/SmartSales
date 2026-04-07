import { axiosInstance } from "@/api/axiosInstance";
import { ItemStockReportResponse } from "@/types/SummaryReport/SummaryReport";

export const getAllItemStockReport = async (date?: string): Promise<ItemStockReportResponse> => {
    try {
        const response = await axiosInstance.get("/report/itemwise", { params: date ? { date } : {} });
        return response.data;
    } catch (err) {
        console.warn("Error while fetching Item Stock Report", err);
        throw err;
    }
};
