// ================= TYPES =================
  // types/RoleTran/RoleTran.ts

export interface Module {
  ID: number;
  NAME: string;
  DISPLAYORDER: number;
  ACTIVE: boolean;
}

export interface SubModule {
  ID: number;
  NAME: string;
  DISPLAYORDER: number;
  ACTIVE: boolean;
  NAVHEADER: Module;
}

export interface Content {
  ID: number;
  NAME: string;
  DISPLAYORDER: number;
  ACTIVE: boolean;
  SUBMODULE: SubModule;
}

// ================= MENU TYPES =================

export interface MenuContent {
  ID: number;
  NAME: string;
}

export interface MenuSubModule {
  ID: number;
  NAME: string;
  CONTENTS: MenuContent[];
}

export interface MenuModule {
  ID: number;
  NAME: string;
  CONTENTS: MenuContent[];
  SUBMODULES: MenuSubModule[];
}

// ================= ROLE TRANSACTION TYPES =================

export interface RoleTran {
  SNO?: number;
  ROLEID: number;
  ROLENAME: string;
  MODULEID: number;
  MODULENAME: string;
  SUBMODULEID: number;
  SUBMODULENAME: string;
  CONTENTID: number;
  CONTENTNAME: string;
  ACTIVE?: boolean;
}