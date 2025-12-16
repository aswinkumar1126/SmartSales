import { useQuery } from "@tanstack/react-query";
import { getUserById } from "@/service/UserService";

export const useUserById = (userId?: number) => {
    return useQuery({
        queryKey: ["users", userId],
        queryFn: () => getUserById(userId!),
        enabled: !!userId,
    });
};
