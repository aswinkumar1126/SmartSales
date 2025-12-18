import { axiosInstance } from "@/api/axiosInstance";
import { UserMaster ,ApiResponse } from "@/types/user/user";


/* ---------- POST (REGISTER WITH IMAGE) ---------- */
export const registerUser = async (
    user: UserMaster,
    image?: File
): Promise<ApiResponse<UserMaster>> => {
    const formData = new FormData();
    formData.append(
        "user",
        new Blob([JSON.stringify(user)], { type: "application/json" })
    );

    if (image) {
        formData.append("image", image);
    }
console.log(formData , user , image)
    const { data } = await axiosInstance.post("/user/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    console.log(data)
    return data;
};

/* ---------- GET ALL ---------- */
export const getAllUsers = async (): Promise<ApiResponse<UserMaster[]>> => {
    const { data } = await axiosInstance.get("/user");
    return data;
};

/* ---------- GET BY ID ---------- */
export const getUserById = async (
    userId: number
): Promise<ApiResponse<UserMaster>> => {
    const { data } = await axiosInstance.get(`/user/${userId}`);
    return data;
};

/* ---------- PATCH ---------- */
export const patchUser = async (
    userId: number,
    updates: Partial<UserMaster>
): Promise<ApiResponse<UserMaster>> => {
    const { data } = await axiosInstance.patch(`/user/${userId}`, updates);
    return data;
};