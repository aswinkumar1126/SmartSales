import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MetalService, Metal } from '@/service/metalService'

export const useUpdateMetal = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, metal }: { id: string; metal: Metal }) =>
            MetalService.updateMetal(id, metal),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["metals"] });
            queryClient.invalidateQueries({ queryKey: ["metals", "active"] });
        },
    });
};
