import { TouchMastService } from "@/service/TouchService";
import { useQuery } from "@tanstack/react-query";

export const useTouchMasterDataById = (id:number|null) =>{
    return useQuery({
        queryKey: ["touchMastbyId",id],
        queryFn: () => TouchMastService().getTouchMastDataById(id),

        select: (data) => data.data,
        enabled : !!id
    })
}