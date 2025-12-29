export interface UserMaster {
    COSTID?: string;
    USERID?: number;
    USERNAME: string;
    PWD?: string;
    AUTHPWD?: string;
    ACTIVE?: "Y" | "N";
    UPUSERID?: number;
    UPDATED?: string;
    UPTIME?: string;
    CENTLOGIN?: string;
    PWDCHANGE?: number;
    PWDUPDATE?: string;
    USERCOSTID?: string;
    USERIMAGE?: string;
    USERCOMPANYID?: string;
    BILLING?: boolean;
}

export interface ApiResponse<T> {
    status: "success" | "error" | boolean;
    message: string;
    data: T;
}
