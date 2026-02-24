import { axiosInstance } from "@/api/axiosInstance";// your configured axios
import { ItemMast } from "@/types/item/item";

const BASE = "/item";

export const ItemService = {
    getAll: async (filter?: string) => {
        try {
            const response = await axiosInstance.get(`${BASE}/all`, {
                // If filter exists, send as `search` query param
                params: filter ? { filter : filter } : undefined,
            });
            return response.data;
        } catch (error: any) {
            console.error('Error fetching all items:', error?.response?.data || error.message);
            throw error;
        }
    },
    getStoneItems: async (filter?: string) => {
        try {
            const response = await axiosInstance.get(`${BASE}/stone`, {
                // If filter exists, send as `search` query param
                params: filter ? { filter: filter } : undefined,
            });
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
            const response = await axiosInstance.put(`${BASE}/update`, payload);
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
