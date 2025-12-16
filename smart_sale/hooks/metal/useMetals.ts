import { useQuery } from "@tanstack/react-query";
import { MetalService, Metal } from '@/service/metalService'

export const useAllMetals = () => {
    return useQuery<Metal[], Error>({
        queryKey: ["metals"],
        queryFn: MetalService.getAllMetals,
    });
};

export const useActiveMetals = () => {
    return useQuery<Metal[], Error>({
        queryKey: ["metals", "active"],
        queryFn: MetalService.getActiveMetals,
    });
};

export const useMetalById = (id: string) => {
    return useQuery<Metal, Error>({
        queryKey: ["metal", id],
        queryFn: () => MetalService.getMetalById(id),
        enabled: !!id, // only fetch if id is defined
    });
};
