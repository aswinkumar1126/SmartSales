import { useQuery } from "@tanstack/react-query";
import { pureGoldMastService } from "@/service/pureGoldService";

export const usePureGoldData = () => {
    return useQuery({
        queryKey: ["pureGoldData"],
        queryFn: pureGoldMastService().getAllPureGoldData,
        select:(data)=>data.data 
    });
};

export const usePureGoldDataById = (id: number) => {
    return useQuery({
        queryKey: ["pureGoldData", id],
        queryFn: () => pureGoldMastService().getPureGoldMastDataById(),
    });
};