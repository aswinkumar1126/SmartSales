// hooks/party/useUpdateParty.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePartyDataById } from "@/service/partyService";
import { CreateParty } from "@/types/party/party";

type UpdatePartyInput = {
    id: number;
    payload: CreateParty;
};

export const useUpdateParty = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: UpdatePartyInput) =>
            updatePartyDataById(id, payload),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["parties"] });
        },
    });
};
