import { useQuery } from "@tanstack/react-query";
import { pureGoldMastService } from "@/service/pureGoldService";

export const usePureGoldData = (filters: any) => {
    return useQuery({
        queryKey: ["pureGoldData", filters], // 👈 include filters
        queryFn: () => pureGoldMastService().getAllPureGoldData(filters),
        select: (data) => data.data,
    });
};
export const usePureGoldDataById = (id: number) => {
    return useQuery({
        queryKey: ["pureGoldData", id],
        queryFn: () => pureGoldMastService().getPureGoldMastDataById(id),
    });
};

/* ----------------------Pure Gold Name ------------------*/

export const usePureGoldNames = () => {
    return useQuery({
        queryKey: ["pureGoldDName"], // 👈 include filters
        queryFn: () => pureGoldMastService().getPureGoldNames(),
        select: (data) => data.data,
    });
};
export const usePureGoldNameById = (id: number) => {
    return useQuery({
        queryKey: ["pureGoldDName", id],
        queryFn: () => pureGoldMastService().getPureGoldNamesById(id),
    });
};