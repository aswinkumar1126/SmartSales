import { axiosInstance } from "@/api/axiosInstance";// your configured axios
import { ItemMast ,ItemResponse } from "@/types/item/item";
import { ApiResponse } from "@/types/api/apiResponse";

const BASE = "/item";


type stoneItemsParam = {

    STUDDED?: "Y" | "N",
    STUDDEDTYPE?: "T" | "D" | "" | string;
    STNPRESENT?: "Y" | "N";
    STOCKTYPE?: "T" | "N" | string;

}

export const ItemService = {
    getAll: async (filter?: string, advancedFilter?: Record<string, any>): Promise<ApiResponse<ItemResponse>> => {
        console.log(filter, advancedFilter, 'filter and advanced filter')
        try {
            const response = await axiosInstance.get(`${BASE}/all`, {
                params: {
                    ...(filter ? { filter } : {}),
                    ...advancedFilter,
                },
            });
            console.log(response.data ,'response data from item')
            return response.data;
        } catch (error: any) {
            console.error('Error fetching all items:', error?.response?.data || error.message);
            throw error;
        }
    },
    getStoneItems: async (filter?: stoneItemsParam) => {
        try {
            const cleanedParams = Object.fromEntries(
                Object.entries(filter || {}).filter(
                    ([_, value]) => value !== undefined && value !== null
                )
            );
            
            console.log(cleanedParams,'cleanedParams')
            const response = await axiosInstance.get(`${BASE}`, {
                params: Object.keys(cleanedParams).length
                    ? cleanedParams
                    : undefined,
            });
            console.log(response.data, 'stone items response')
            return response.data;
        } catch (error: any) {
            console.error('Error fetching all items:', error?.response?.data || error.message);
            throw error;
        }
    },
    getById: async (id: number) => {
        try {
            console.log(id,'id for itemByid')
            const response = await axiosInstance.get(`${BASE}/${id}`);
            console.log(response.data,'response from itemById')
            return response.data;
        } catch (error: any) {
            console.error(`Error fetching item with id ${id}:`, error?.response?.data || error.message);
            throw error;
        }
    },

    // ✅ Create new item
    create: async (payload: ItemMast) => {
        console.log("Sending payload to server:", payload);
        try {
            const response = await axiosInstance.post(BASE, payload);
            return response.data;
        } catch (error: any) {
            console.error('Error creating item:', error?.response?.data || error.message);
            throw error;
        }
    },

    // ✅ Update item
    update: async (payload: ItemMast) => {
        try {
            console.log("Sending payload to server:", payload);
            const response = await axiosInstance.put(`${BASE}/update`, payload);
            console.log(response ,'response from api')
            return response.data;
        } catch (error: any) {
            console.error('Error updating item:', error?.response?.data || error.message);
            throw error;
        }
    },

    // ✅ Delete item
    remove: async (id: number) => {
        try {
            const response = await axiosInstance.delete(`${BASE}/delete/${id}`);
            return response.data;
        } catch (error: any) {
            console.error(`Error deleting item with id ${id}:`, error?.response?.data || error.message);
            throw error;
        }
    },
};
