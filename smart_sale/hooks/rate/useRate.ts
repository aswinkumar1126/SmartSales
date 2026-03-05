import { useQuery ,useQueryClient , useMutation } from "@tanstack/react-query";
import { RateEntryService } from "@/service/RateEntry";
import { RatePayload } from "@/types/rate/rate";


export const useRates = () => {
    return useQuery({
        queryKey:['rates'],
        queryFn:RateEntryService.getLatestRate,
        select:(res)=>res.data
        
    })
}

export const useCreateRate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: RatePayload) => RateEntryService.createRate(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rates'] });
        }
    })
}