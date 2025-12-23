import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPartyData } from "@/service/partyService";
import { CreateParty } from "@/types/party/party";

export const useCreateParty = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateParty) => createPartyData(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["parties"] });
        },
    });
};
