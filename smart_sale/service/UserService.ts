import { axiosInstance } from "@/api/axiosInstance";
import { UserMaster, ApiResponse } from "@/types/user/user";

/* ---------- POST (REGISTER WITH IMAGE) ---------- */
export const registerUser = async (
    user: UserMaster,
    image?: File
): Promise<ApiResponse<UserMaster>> => {
    try {
      
        const formData = new FormData();

        formData.append(
            "user",
            new Blob([JSON.stringify(user)], {
                type: "application/json",
            })
        );

        if (image) {
            formData.append("image", image);
        }

        const { data } = await axiosInstance.post(
            "/user/register",
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );

        return data;
    } catch (error: any) {
        console.error("Register user failed:", error);

        return {
            status: "error",
            message:
                error?.response?.data?.message ||
                "User registration failed",
            data: {} as UserMaster,
        };
    }
};

/* ---------- GET ALL ---------- */
export const getAllUsers = async (): Promise<ApiResponse<UserMaster[]>> => {
    try {
        const { data } = await axiosInstance.get("/user");
        return data;
    } catch (error: any) {
        console.error("Fetch users failed:", error);

        return {
            status: "error",
            message:
                error?.response?.data?.message ||
                "Failed to fetch users",
            data: [] as UserMaster[],
        };
    }
};

/* ---------- GET BY ID ---------- */
export const getUserById = async (
    userId: number
): Promise<ApiResponse<UserMaster>> => {
    try {
        const { data } = await axiosInstance.get(`/user/${userId}`);
      
        return data;
    } catch (error: any) {
        console.error("Fetch user failed:", error);

        return {
            status: "error",
            message:
                error?.response?.data?.message ||
                "Failed to fetch user",
            data: {} as UserMaster,
        };
    }
};

/* ---------- PATCH ---------- */
export const patchUser = async (
    userId: number,
    formData: FormData
): Promise<ApiResponse<UserMaster>> => {
    try {
        for (const [key, value] of formData.entries()) {
            console.log(key, value);
        }
        const { data } = await axiosInstance.put(
            `/user/${userId}`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );
        return data;
    } catch (error: any) {
        console.error("Update user failed:", error);

        return {
            status: "error",
            message:
                error?.response?.data?.message || "Failed to update user",
            data: {} as UserMaster,
        };
    }
};

