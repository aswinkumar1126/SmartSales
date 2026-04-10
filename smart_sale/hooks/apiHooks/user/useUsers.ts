import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "@/service/UserService";

export const useUsers = () => {
    return useQuery({
        queryKey: ["users"],
        queryFn: getAllUsers,
    });
};
