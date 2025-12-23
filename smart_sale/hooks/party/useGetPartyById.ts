
import { useQuery } from "@tanstack/react-query";
import { getPartyDataById } from "@/service/partyService";

export const usePartyById = (id: string) => {
    return useQuery({
        queryKey: ["party", id],
        queryFn: () => getPartyDataById(id),
        enabled: !!id, // prevents unnecessary calls
    });
};
