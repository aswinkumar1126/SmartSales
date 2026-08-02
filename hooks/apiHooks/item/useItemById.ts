import { useQuery } from "@tanstack/react-query";
import { ItemService } from "@/service/ItemService";
import { normalizeItem } from "@/utils/normalize/normalizeItem";
import { toastLoaded } from "@/component/toast/toast";

export const useItemById = (id?: number) =>
    useQuery({
        queryKey: ["item", id],
        enabled: !!id,
        queryFn: async () => {
            const res = await ItemService.getById(id!);
          
            return normalizeItem(res.data);
        },
    });
