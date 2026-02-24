import { useQuery } from "@tanstack/react-query";
import { ItemService } from "@/service/ItemService";

export const useItems = (filter?: string) => {
    return useQuery({
        queryKey: ["items", filter],
        queryFn: async () => {
            const res = await ItemService.getAll(filter);
            return res.data; // res is already the data from API
        },
    });
};

export const useStoneItems = (filter?:string) =>{
    return useQuery({
        queryKey: ["stoneItems", filter],
        queryFn: async () => {
            const res = await ItemService.getStoneItems(filter);
            return res.data; // res is already the data from API
        },
    });
}
