import { axiosInstance } from "@/api/axiosInstance";
import { ApiResponse } from "@/types/api/apiResponse";

import { BarcodeDetails, BarCodeFilter } from "@/types/barcode/BarcodeDetails";


export const getBarcodeItemsDetails = async (
    data: BarCodeFilter
): Promise<ApiResponse<BarcodeDetails>> => {
    try {
        // Filter out keys with null, undefined, or empty string values
        const params = Object.fromEntries(
            Object.entries(data).filter(
                ([_, value]) => value !== undefined && value !== null && value !== ''
            )
        );

        console.log(params, 'filtered service params');

        const response = await axiosInstance.get('/purchase/untagged', { params });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const getBarcodeFilters = async (
    params: any
): Promise<ApiResponse<any>> => {
    try {

        console.log(params, 'filtered service params');

        const response = await axiosInstance.get('/tagged', { params });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};