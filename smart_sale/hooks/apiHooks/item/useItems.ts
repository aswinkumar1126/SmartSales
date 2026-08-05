import { useQuery } from "@tanstack/react-query";
import { ItemService } from "@/service/ItemService";

type stoneItemsParam = {

    STUDDED?:"Y"|"N",
    STUDDEDTYPE?: "T"|"D" | "" | string;
    STNPRESENT?:"Y"|"N";
    STOCKTYPE ?: "T" | "N" | string;

}

export const useItems = (filter?: string, advancedFilter: Record<string, any> = {}) => {
    return useQuery({
        queryKey: ["items", filter, advancedFilter],
        queryFn: async () => {
            const res = await ItemService.getAll(filter, advancedFilter);
            return res.data; // res is already the data from API
            
        },
    });
};

export const useStoneItems = (filter?:stoneItemsParam) =>{
    return useQuery({
        queryKey: ["stoneItems", filter],
        queryFn: async () => {
            const res = await ItemService.getStoneItems(filter);
            return res.data; // res is already the data from API
        },
    });
}
