// service/UserRoleService.ts

import { axiosInstance } from "@/api/axiosInstance";
import { UserRole, UserRolePayload } from "@/types/UserRole/UserRole";

const BASE_URL = "/userrole";

export const fetchUserRoles = async () => {
  const { data } = await axiosInstance.get<UserRole[]>(BASE_URL);
  return data;
};

export const fetchUserRoleById = async (id: number) => {
  const { data } = await axiosInstance.get<UserRole>(`${BASE_URL}/${id}`);
  return data;
};

export const createUserRole = async (payload: UserRolePayload) => {
  const { data } = await axiosInstance.post(BASE_URL, payload);
  return data?.data;
};

export const updateUserRole = async (id: number, payload: UserRolePayload) => {
  const { data } = await axiosInstance.put(`${BASE_URL}/${id}`, payload);
  return data?.data;
};

export const deleteUserRole = async (id: number) => {
  const { data } = await axiosInstance.delete(`${BASE_URL}/${id}`);
  return data;
};