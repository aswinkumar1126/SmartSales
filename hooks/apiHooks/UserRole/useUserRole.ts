// hooks/UserRole/useUserRole.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchUserRoles,
  createUserRole,
  updateUserRole,
  deleteUserRole,
} from "@/service/UserRoleMasterService";

export const useUserRole = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["user-roles"],
    queryFn: fetchUserRoles,
  });

  const createMutation = useMutation({
    mutationFn: createUserRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: any) => updateUserRole(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUserRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
    },
  });

  return {
    userRoles: data || [],
    loading: isLoading,
    addUserRole: createMutation.mutateAsync,
    editUserRole: updateMutation.mutateAsync,
    removeUserRole: deleteMutation.mutateAsync,
  };
};