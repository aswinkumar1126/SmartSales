import { getAllStates } from "@/service/StateService";
import { useQuery } from "@tanstack/react-query";

export const useAllStates = () =>{
    return useQuery({
        queryKey: ['states'],
        queryFn: getAllStates,
    })
}