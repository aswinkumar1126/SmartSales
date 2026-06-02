export interface Role {
  ROLEID: number;
  ROLENAME: string;
  ACTIVE: "Y" | "N";
  MARGINIDS: string;
  PWDACCESS: "Y" | "N";
  ADMINACCESS: "Y" | "N";
  USERID: number;
  UPDATED: string;
  UPTIME: string;
}

export interface RolePayload {
  ROLENAME: string;
  ACTIVE: "Y" | "N";
  MARGINIDS?: string;
  PWDACCESS: "Y" | "N";
  ADMINACCESS: "Y" | "N";
  USERID: number;
}

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}