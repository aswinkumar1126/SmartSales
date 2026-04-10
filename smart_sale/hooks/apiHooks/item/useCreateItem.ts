import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ItemService } from "@/service/ItemService";
import { ItemMast } from "@/types/item/item";
import { toastCreated, toastError } from "@/component/toast/toast";

export const useCreateItem = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (payload: ItemMast) =>
            ItemService.create(payload),

        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["items"] });
            toastCreated("Item");
        },
        onError:(error) =>{
            console.error("Error creating item:", error);
            toastError("Item");
        }
    });
};
