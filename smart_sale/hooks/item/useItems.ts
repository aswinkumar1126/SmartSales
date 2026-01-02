import { useQuery } from "@tanstack/react-query";
import { ItemService } from "@/service/ItemService";
import { normalizeItem } from "@/utils/normalize/normalizeItem";

export const useItems = () =>
    useQuery({
        queryKey: ["items"],
        queryFn: async () => {
            const res = await ItemService.getAll();
            //console.log(res,'item');
            return res.data.data;
        },
    });
