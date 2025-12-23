import { useMutation, useQueryClient } from "@tanstack/react-query";
import { registerUser } from "@/service/UserService";
import { UserMaster } from "@/types/user/user";
import { toastCreated ,toastError } from "@/component/toast/toast";

export const useCreateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            user,
            image,
        }: {
            user: UserMaster;
            image?: File;
        }) => registerUser(user, image),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toastCreated("User")
        },
        onError: (error) => {
            console.error("Error creating user:", error);
          toastError("User");
        }
    });
};
