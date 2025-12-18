import { axiosInstance } from "@/api/axiosInstance";// your configured axios
import { ItemMast } from "@/types/item/item";

const BASE = "/item";

export const ItemService = {
    getAll: () => axiosInstance.get(`${BASE}/all`),

    getById: (id: number) =>
        axiosInstance.get(`${BASE}/${id}`),

    create: (payload: ItemMast) =>
        axiosInstance.post(BASE, payload),

    update: (payload: ItemMast) =>
     
        axiosInstance.put(`${BASE}/update`, payload),

    remove: (id: number) =>
        axiosInstance.delete(`${BASE}/delete/${id}`),
};
