import { TouchMastService } from "@/service/TouchService";
import { useQuery } from "@tanstack/react-query";

export const useTouchMasterDataById = () =>{
    return useQuery({
        queryKey: ["touchMast"],
        queryFn: TouchMastService().getTouchMastData,
        select: (data) => data.data,
    })
}