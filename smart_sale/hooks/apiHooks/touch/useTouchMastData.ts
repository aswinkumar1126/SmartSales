import { TouchMastService } from "@/service/TouchService";
import { useQuery } from "@tanstack/react-query";

export const useTouchMastData = (filter?:string) =>{
    return useQuery({
        queryKey: ["touchMast",filter],
        queryFn: () => TouchMastService().getTouchMastData(filter), // pass a function
        select: (data) => data.data,
    }   
    )
}