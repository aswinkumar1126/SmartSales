import { useQuery } from "@tanstack/react-query";
import { MetalService, Metal, getMetalBySno, MetalData } from '@/service/metalService'


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
export const useMetalBySno = (sno: number | null) => {
    return useQuery<MetalData, Error>({
        queryKey: ["metal", "sno", sno],
        queryFn: () => getMetalBySno(sno!),
        enabled: !!sno,
    });
};