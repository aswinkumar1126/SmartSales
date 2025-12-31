import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patchUser } from "@/service/UserService";
import { UserMaster } from "@/types/user/user";
import { toastError, toastUpdated } from "@/component/toast/toast";

export const usePatchUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            userId,
            formData,
        }: {
            userId: number;
            formData: FormData;
        }) => patchUser(userId, formData),

        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["users", vars.userId] });
            toastUpdated("User");
        },

        onError: () => {
            toastError("User");
        },
    });
};
