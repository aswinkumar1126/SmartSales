import { useQuery } from "@tanstack/react-query";
import { ItemService } from "@/service/ItemService";
import { normalizeItem } from "@/utils/normalize/normalizeItem";

export const useItems = () =>
    useQuery({
        queryKey: ["items"],
        queryFn: async () => {
            const res = await ItemService.getAll();
            return res.data.map(normalizeItem);
        },
    });
