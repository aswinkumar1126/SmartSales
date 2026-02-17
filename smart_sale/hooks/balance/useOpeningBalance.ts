import { useQuery } from "@tanstack/react-query";
import { getOpeningBalance } from "@/service/OpenBalance";

export const useOpeningBalance = (ACCCODE:number|null|undefined) =>{
    return useQuery({
        queryKey:['openingBalance',ACCCODE],
        queryFn:()=>getOpeningBalance(ACCCODE),
        enabled:!!ACCCODE,

    })
} 