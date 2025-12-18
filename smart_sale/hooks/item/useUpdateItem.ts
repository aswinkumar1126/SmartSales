import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ItemService } from "@/service/ItemService";
import { ItemMast } from "@/types/item/item";
import { toastUpdated ,toastError } from "@/component/toast/toast";
export const useUpdateItem = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (payload: ItemMast) =>
            ItemService.update(payload),

        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["items"] });
            toastUpdated("Item");
        },
        onError: () => {
            console.error("Error updating item");
            toastError("Item")
        }
    });
};
