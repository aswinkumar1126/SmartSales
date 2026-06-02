// types/UserRole/UserRole.ts

export interface UserRole {
  USERID: number;
  ROLEID: number;
  UPUSERID?: number;
  UPDATED?: string;
  UPTIME?: string;
}

export interface UserRolePayload {
  USERID: number;
  ROLEID: number;
  UPUSERID?: number;
}