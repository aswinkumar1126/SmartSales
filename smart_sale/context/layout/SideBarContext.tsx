"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type SidebarMenu = Record<string, Record<string, (string | { label: string; route: string })[]>>;

const SidebarContext = createContext<any>(undefined);

export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {

  // 👇 DUMMY DATA (Later replace with API)
  const [menuData] = useState<SidebarMenu>({
    Master: {
      Account: [{
        label: "Company",
        route: "/dashboard/Master/Account/Company"
      }, {
        label: "Customer",
        route: "/dashboard/Master/Account/Company"
      }],
      ItemMaster: [{
        label: "Metal",
        route: "/dashboard/Master/Item/Metal"
      }, {
        label: "Customer",
        route: "dashboard/Master/Account/Company"
      }],
      UserMaster: [{
        label: "Company",
        route: "/dashboard/Master/Account/Company"
      }, {
        label: "Customer",
        route: "/dashboard/Master/Account/Company"
      }],
      Role: [{
        label: "UserMaster",
        route: "/dashboard/Master/Role/UserMaster"
      }, {
        label: "Customer",
        route: "/dashboard/Master/Role/UserMaster"
      }],
    },
    RateEntry: {
      GoldRate: [{
        label: "Company",
        route: "/dashboard/Master/Account/Company"
      }, {
        label: "Customer",
        route: "/dashboard/Master/Account/Company"
      }],
      SilverRate: [{
        label: "Company",
        route: "/dashboard/Master/Account/Company"
      }, {
        label: "Customer",
        route: "/dashboard/Master/Account/Company"
      }],
    }
  });

  const [currentSection, setCurrentSection] = useState("Master");
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleNode = (key: string) => {
    setExpandedNodes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <SidebarContext.Provider
      value={{
        currentSection,
        setCurrentSection,
        expandedNodes,
        toggleNode,
        menuData,  // 👈 SHARED HERE
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
