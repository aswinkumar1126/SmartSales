import { useQuery } from "@tanstack/react-query";
import { pureGoldMastService } from "@/service/pureGoldService";

export const usePureGoldData = (filter?:string,filters?: any ,entryNo?:number , tranType?:"PU"|"SA") => {
    return useQuery({
        queryKey: ["pureGoldData", filter, filters, entryNo?.toString(), tranType], // 👈 include filters
        queryFn: () => pureGoldMastService().getAllPureGoldData(filter, filters, entryNo, tranType),
        select: (data) => data.data,
        
    });
};
export const usePureGoldDataById = (id: number) => {
    return useQuery({
        queryKey: ["pureGoldData", id],
        queryFn: () => pureGoldMastService().getPureGoldMastDataById(id),
        select: (data) => data.data,
    });
};

/* ----------------------Pure Gold Name ------------------*/

export const usePureGoldNames = (filter?:string) => {
    return useQuery({
        queryKey: ["pureGoldDName", filter], // 👈 include filters
        queryFn: () => pureGoldMastService().getPureGoldNames(filter),
        select: (data) => data.data,
    });
};
export const usePureGoldNameById = (id: number) => {
    return useQuery({
        queryKey: ["pureGoldDName", id],
        queryFn: () => pureGoldMastService().getPureGoldNamesById(id),
    });
};