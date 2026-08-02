// ================= SERVICE =================
// service/RoleTranService.ts

import { axiosInstance } from "@/api/axiosInstance";

import {
  Module,
  SubModule,
  Content,
  MenuModule,
  RoleTran,
} from "@/types/RoleTran/RoleTran";

// =====================================================
// MODULE
// =====================================================

// CREATE MODULE
export const createModule = async (body: {
  NAME: string;
  DISPLAYORDER: number;
}) => {
  console.log(body,'createModulePayload');
  const { data } = await axiosInstance.post<Module>(
    `/module`,
    body
  );

  return data;
};

// GET MODULES
export const getModules = async () => {
  const { data } = await axiosInstance.get<Module[]>(
    `/module`
  );

  return data;
};

// GET MENU (full tree)
export const getMenu = async () => {
  const { data } = await axiosInstance.get<MenuModule[]>(
    `/menu`
  );

  return data;
};

// UPDATE MODULE
export const updateModule = async ({
  id,
  body,
}: {
  id: number;
  body: {
    NAME: string;
    DISPLAYORDER: number;
    ACTIVE: boolean;
  };
}) => {
  const { data } = await axiosInstance.put<Module>(
    `/module/${id}`,
    body
  );

  return data;
};

// DELETE MODULE
export const deleteModule = async (id: number) => {
  const { data } = await axiosInstance.delete(
    `/module/${id}`
  );

  return data;
};

// =====================================================
// SUB MODULE
// =====================================================

// CREATE SUB MODULE
export const createSubModule = async (
  moduleId: number,
  body: {
    NAME: string;
    DISPLAYORDER: number;
  }
) => {
  const { data } = await axiosInstance.post<SubModule>(
    `/submodule/${moduleId}`,
    body
  );

  return data;
};

// GET SUB MODULES
export const getSubModules = async (
  moduleId: number
) => {
  const { data } = await axiosInstance.get<SubModule[]>(
    `/submodule/module/${moduleId}`
  );

  return data;
};

// UPDATE SUB MODULE
export const updateSubModule = async ({
  id,
  body,
}: {
  id: number;
  body: {
    NAME: string;
    DISPLAYORDER: number;
    ACTIVE: boolean;
  };
}) => {
  const { data } = await axiosInstance.put<SubModule>(
    `/submodule/${id}`,
    body
  );

  return data;
};

// DELETE SUB MODULE
export const deleteSubModule = async (id: number) => {
  const { data } = await axiosInstance.delete(
    `/submodule/${id}`
  );

  return data;
};

// =====================================================
// CONTENT
// =====================================================

// CREATE CONTENT (by submodule)
export const createContent = async (
  body: {
    NAME: string;
    DISPLAYORDER: number;
    NAVHEADER :number ;
    NAVSUBHEADER?:number;
  }
) => {
  console.log(body ,'payload to create content');
  // return;
  const { data } = await axiosInstance.post<Content>(
    `/content`,
    body
  );

  return data;
};


// GET CONTENTS (by submodule)
export const getContents = async ({
  id,
  ISHEADER,
}: {
  id: number;
  ISHEADER: boolean;
}) => {
  console.log(id, ISHEADER, "contentgetting");

  const res = await axiosInstance.get<Content[]>(
    `/content/${id}`,
    {
      params: {
        ISHEADER,
      },
    }
  );

  console.log("getContents", res);

  return res.data;
};

// UPDATE CONTENT
export const updateContent = async ({
  id,
  body,
}: {
  id: number;
  body: {
    NAME: string;
    DISPLAYORDER: number;
    ACTIVE: boolean;
    NAVHEADER: number;
    NAVSUBHEADER?: number;
  };
}) => {
  const { data } = await axiosInstance.put<Content>(
    `/content/${id}`,
    body
  );

  return data;
};

// DELETE CONTENT
export const deleteContent = async (id: number) => {
  const { data } = await axiosInstance.delete(
    `/content/${id}`
  );

  return data;
};

// =====================================================
// ROLE TRANSACTION
// =====================================================

// GET ROLE TRANSACTIONS
export const getRoleTransactions = async () => {
  const { data } = await axiosInstance.get<RoleTran[]>(
    `/role-tran`
  );

  return data;
};

// INSERT ROLE TRANSACTION
export const insertRoleTransaction = async (body: RoleTran[]) => {
  const { data } = await axiosInstance.post<RoleTran[]>(
    `/role-tran/insert`,
    body
  );

  return data;
};

// SAVE SINGLE ROLE TRANSACTION
export const saveRoleTransaction = async (body: RoleTran) => {
  const { data } = await axiosInstance.post<RoleTran>(
    `/role-tran`,
    body
  );

  return data;
};

// GET ROLE TRANSACTIONS BY ROLE ID
export const getRoleTransactionsByRoleId = async (roleId: number) => {
  const { data } = await axiosInstance.get<RoleTran[]>(
    `/role-tran/role/${roleId}`
  );

  return data;
};

// GET ACTIVE ROLE TRANSACTIONS
export const getActiveRoleTransactions = async () => {
  const { data } = await axiosInstance.get<RoleTran[]>(
    `/role-tran/active`
  );

  return data;
};

// GET ACTIVE ROLE TRANSACTIONS BY ROLE ID
export const getActiveRoleTransactionsByRoleId = async (roleId: number) => {
  const { data } = await axiosInstance.get<RoleTran[]>(
    `/role-tran/role/${roleId}/active`
  );

  return data;
};

// DELETE ROLE TRANSACTION
export const deleteRoleTransaction = async (sno: number) => {
  const { data } = await axiosInstance.delete<string>(
    `/role-tran/${sno}`
  );

  return data;
};

// TOGGLE ACTIVE STATUS
export const toggleRoleTransactionActive = async (sno: number) => {
  const { data } = await axiosInstance.put<RoleTran>(
    `/role-tran/${sno}/toggle`
  );

  return data;
};