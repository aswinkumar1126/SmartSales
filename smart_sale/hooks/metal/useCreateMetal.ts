import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MetalService, Metal } from "@/service/metalService";
import { toastCreated  ,toastError} from "@/component/toast/toast";

export const useCreateMetal = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (metal: Metal) => MetalService.createMetal(metal),
        onSuccess: () => {
            // refresh metal list after creation
            queryClient.invalidateQueries({ queryKey: ["metals"] });
            queryClient.invalidateQueries({ queryKey: ["metals", "active"] });
            toastCreated("Metal");
        },
        onError: (error) => {
            console.error("Error creating metal:", error);
            toastError("Metal", error.message);
        }
    });
};
