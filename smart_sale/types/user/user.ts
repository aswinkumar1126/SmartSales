export interface UserMaster {
    costId?: string;
    userId?: number;
    username: string;
    pwd?: string;
    authPwd?: string;
    active?: "Y" | "N";
    upUserId?: number;
    updated?: string;
    upTime?: string;
    centLogin?: string;
    pwdChange?: number;
    pwdUpdated?: string;
    userCostId?: string;
    userImage?: string;
    userCompanyId?: string;
    billing?: boolean;
}

export interface ApiResponse<T> {
    status: "success" | "error" | boolean;
    message: string;
    data: T;
}
