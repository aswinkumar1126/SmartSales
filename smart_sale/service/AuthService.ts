// src/service/AuthService.ts
import { axiosInstance } from "@/api/axiosInstance";

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    status?: number;
}

export interface LoginPayload {
    username: string;
    password: string;
}

export interface RegisterPayload {
    name: string;
    mobile: string;
    email: string;
    password: string;
}

export const authService = {
    // ✅ REGISTER (UNCHANGED)
    register: async (data: RegisterPayload): Promise<ApiResponse> => {
        try {
            const res = await axiosInstance.post("/user/register", data);
            return { success: true, data: res.data };

        } catch (error: any) {
            return {
                success: false,
                message:
                    error?.response?.data?.message || "Registration failed",
                status: error?.response?.status,
            };
        }
    },

    // 🔐 LOGIN (FIXED)
    login : async (payload: LoginPayload) => {
        try {
            const response = await axiosInstance.post("/user/login", payload);

            console.log("Login successful:", response);
            return response.data;
        } catch (error: any) {
         
            if (!error.response) {
                return {
                    status: "error",
                    message: "Server not reachable. Please try again later.",
                    data: null,
                };
            }

            return {
                status: "error",
                message:
                    error?.response?.data?.message ||
                    "Login request failed",
                data: null,
            };
        }
    },

    // 👤 FETCH USER
    me: async (userId: number): Promise<ApiResponse> => {
        console.log("Fetching user with ID:", userId);
        try {
            const res = await axiosInstance.get(`/user/${userId}`);
            console.log(res ,'response for fetch data')
            return { success: true, data: res.data };
        } catch {
            return { success: false, message: "Failed to fetch user" };
        }
    },
};
