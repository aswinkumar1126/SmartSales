import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery, useApiMutation } from "../apiHook/ApiHook";
import { ItemSize, ItemSizePayload } from "@/types/size/Size";
import { axiosInstance } from "@/api/axiosInstance";

/* -------------------- FETCH ALL SIZES -------------------- */

export const useSize = (filter?: string,ITEMID?:number) => {
    return useApiQuery<ItemSize[]>({
        url: "/itemsize",
        queryKey: ["size", filter ?? "", String(ITEMID) ?? 0],
        params: filter ? { filter, ITEMID } : undefined,
        select: (response: { data: ItemSize[] }) => response.data, // Type the API response
    });
};

/* -------------------- CREATE SIZE -------------------- */
export const useCreateSize = () => {
    return useApiMutation<ItemSize, ItemSizePayload>({
        url: `/itemsize`,
        method: "POST",
        queryKey: ["size"],
        onError:(err)=>err.message
        
    });
};

/* -------------------- UPDATE SIZE -------------------- */
export const useUpdateSize = () => {
    return useApiMutation<ItemSize, ItemSizePayload & { id?: string | number }>({
        url: ({ id }) => `/itemsize/${id}`, // dynamic URL
        method: "PUT",
        queryKey: ["size"],

        // override mutationFn to dynamically add path variable if present
        onMutate: async ({ id, ...payload }) => {
            const path = id ? `/itemsize/${id}` : "/itemsize";
            const res = await axiosInstance.request({
                url: path,
                method: "PUT",
                data: payload,
            });
            return res.data;
        },
    });
};

/* -------------------- DELETE SIZE -------------------- */
export const useDeleteSize = () => {
    return useApiMutation<void, { id: number }>({
        url: "/itemsize",
        method: "DELETE",
        queryKey: ["size"],
    });
};