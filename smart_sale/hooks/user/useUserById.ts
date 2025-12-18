import { useQuery } from "@tanstack/react-query";
import { getUserById } from "@/service/UserService";
import { toastLoaded } from "@/component/toast/toast";

export const useUserById = (userId?: number) => {
    return useQuery({
        queryKey: ["users", userId],
        queryFn: () => getUserById(userId!),
        enabled: !!userId,
    });
};
