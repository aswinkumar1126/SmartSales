import { useEffect, useState } from "react";
import {
  fetchRoles,
  createRole,
  updateRole,
  deleteRole,
} from "@/service/RoleMasterService";
import { Role, RolePayload } from "@/types/RoleMaster/RoleMaster";

export const useRole = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ FETCH
  const loadRoles = async () => {
    setLoading(true);
    try {
      const data = await fetchRoles();
      setRoles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ CREATE
  const addRole = async (payload: RolePayload) => {
    const newRole = await createRole(payload);
    setRoles((prev) => [...prev, newRole]);
  };

  // ✅ UPDATE
  const editRole = async (id: number, payload: RolePayload) => {
    const updated = await updateRole(id, payload);
    setRoles((prev) =>
      prev.map((r) => (r.ROLEID === id ? updated : r))
    );
  };

  // ✅ DELETE
  const removeRole = async (id: number) => {
    await deleteRole(id);
    setRoles((prev) => prev.filter((r) => r.ROLEID !== id));
  };

  useEffect(() => {
    loadRoles();
  }, []);

  return {
    roles,
    loading,
    loadRoles,
    addRole,
    editRole,
    removeRole,
  };
};