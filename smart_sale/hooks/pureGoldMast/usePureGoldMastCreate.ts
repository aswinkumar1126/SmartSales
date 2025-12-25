import { useMutation , QueryClient } from "@tanstack/react-query";
import { pureGoldMastService } from "@/service/pureGoldService";
import { toastCreated } from "@/component/toast/toast";

export const useCreatePureGoldMast = () => {
    const queryClient = new QueryClient();
    return useMutation({
        mutationFn: pureGoldMastService().createPureGoldMast,
        onSuccess: () => {
            toastCreated("Pure Gold Master")
            queryClient.invalidateQueries({ queryKey: ["pureGoldData"] });
        },
    });
};