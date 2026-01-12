import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MetalService, Metal } from '@/service/metalService'
import { toastError, toastUpdated } from "@/component/toast/toast";

export const useUpdateMetal = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ sno, metal }: { sno: number; metal: Metal }) =>
            MetalService.updateMetal(sno, metal),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["metals"] });

            queryClient.invalidateQueries({ queryKey: ["metals", "active"] });
            toastUpdated("Metal");
        },
        onError: (error) => {
            console.error("Error updating metal:", error);
            toastUpdated("Metal")
        }
    });
};
