import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pureGoldMastService } from "@/service/pureGoldService";
import { pureGoldForm } from "@/types/pureGold/pureGold";
import { toastUpdated } from "@/component/toast/toast";

export const useUpdatePureGoldMast = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: pureGoldForm }) =>
            pureGoldMastService().updatepureGoldMastById(id, data),
        onSuccess: () => {
            toastUpdated("Pure Gold Master");
            queryClient.invalidateQueries({ queryKey: ["pureGoldData"] });
        },
    });
};