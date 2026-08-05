import { TouchMastService } from "@/service/TouchService";
import { useQuery } from "@tanstack/react-query";
import { TouchFilter } from "@/types/touch/touch";

export const useTouchMastData = (filter?:string, advancedFilter: Record<string, any> = {}) =>{
    return useQuery({
        queryKey: ["touchMast",filter, advancedFilter],
        queryFn: () => TouchMastService().getTouchMastData(filter, advancedFilter), // pass a function
        select: (data) => data.data,
    }
    )
}

export const useTouchByFilter = (filter:TouchFilter ,enabled:boolean) =>{
    return useQuery({
        queryKey: ["touchMast", filter],
        queryFn: () => TouchMastService().getTouchByFilter(filter), // pass a function
        select: (data) => data.data,
        enabled :enabled
    })
}

