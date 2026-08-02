import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ItemService } from "@/service/ItemService";

export const useDeleteItem = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (id: number) =>
            ItemService.remove(id),

        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["items"] });
        },
    });
};
