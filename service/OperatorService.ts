import { axiosInstance } from "@/api/axiosInstance";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// Operator interface matching /operator/all response
export interface Operator {
  ACTIVE: "Y" | "N";
  CREATED_BY: number;
  CREATED_DATE: string;
  CREATED_TIME: string;
  EMP_CODE: string;
  OPER_CODE: number;
  OPER_NAME: string;
  PASSWORD?: string | null;
}

export interface OperatorDTO {
  OPER_CODE?: number;
  OPER_NAME: string;
  EMP_CODE: string;
  PASSWORD: string;
  AUTHPWD?: string;
  ACTIVE?: "Y" | "N";
  COST_ID?: string;
}

export interface LoginRequest {
  operCode: number;
  password: string;
}

export interface UpdatePasswordRequest {
  OPER_CODE: number;
  OLD_PASSWORD: string;
  NEW_PASSWORD: string;
}

export const OperatorService = {
  register: async (payload: OperatorDTO): Promise<ApiResponse<string>> => {
    const { data } = await axiosInstance.post("/operator/register", payload);
    return data;
  },

  login: async (payload: LoginRequest): Promise<ApiResponse<string>> => {
    const { data } = await axiosInstance.post("/operator/login", payload);
    return data;
  },

  updatePassword: async (payload: UpdatePasswordRequest): Promise<ApiResponse<string>> => {
    const { data } = await axiosInstance.put("/operator/update-password", payload);
    return data;
  },

  deleteOperator: async (operCode: number): Promise<ApiResponse<string>> => {
    const { data } = await axiosInstance.delete(`/operator/delete/${operCode}`);
    return data;
  },

  // ================= GET ALL OPERATORS =================
// ================= GET ALL OPERATORS WITH PAGINATION =================
getAll: async (page: number = 0, size: number = 10) => {
  const { data } = await axiosInstance.get(`/operator/all?page=${page}&size=${size}`);
  return data; // expected: { content: Operator[], totalElements, totalPages, page, size }
},
};