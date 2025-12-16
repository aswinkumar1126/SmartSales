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
    register: async (
        data: RegisterPayload
    ): Promise<ApiResponse> => {
        try {
            const res = await axiosInstance.post("/user/register", data);
            return { success: true, data: res.data };
        } catch (error: any) {
            return {
                success: false,
                message: error?.response?.data?.message || "Registration failed",
                status: error?.response?.status,
            };
        }
    },

    login: async (data: LoginPayload): Promise<ApiResponse> => {
        try {
            const res = await axiosInstance.post("/user/login", data);
            console.log("Backend login response 👉", res.data);

            const result = res.data;

            return {
                success: true,
                message: result.message,
                data: {
                    userId: result.data.USERID,
                    token: result.data.TOKEN ?? String(result.data.USERID), // fallback if no JWT
                },
            };
        } catch (error: any) {
            console.error("Login error", error);

            return {
                success: false,
                message:
                    error?.response?.data?.message ||
                    "Login failed",
                status: error?.response?.status,
            };
        }
    },


    me: async (userId: number): Promise<ApiResponse> => {
        try {
            const res = await axiosInstance.get(`/user/${userId}`);
            return { success: true, data: res.data };
        } catch (error: any) {
            return {
                success: false,
                message: "Failed to fetch user",
            };
        }
    },
};
