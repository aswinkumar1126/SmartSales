"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import {
  Building2,
  Coins,
  Boxes,
  Users,
  Shield,
  TrendingUp,
  Layers,
  DollarSign,
} from "lucide-react";

type MenuItem = {
  label: string;
  route: string;
  icon: object;
};

type MenuGroup = {
  icon: object;
  items: MenuItem[];
};

type SidebarMenu = Record<
  string,
  Record<string, MenuGroup>
>;

const SidebarContext = createContext<any>(undefined);

export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {

  // 👇 DUMMY DATA (Later replace with API)
  const [menuData] = useState<SidebarMenu>({
    Master: {
      Accounts: {
        icon: Building2,
        items: [
          {
            label: "Company",
            route: "/dashboard/Master/Account/Company",
            icon: Building2,
          },
        ],
      },

      Item: {
        icon: Boxes,
        items: [
          {
            label: "Metal",
            route: "/dashboard/Master/Item/Metal",
            icon: Coins,
          },
          {
            label: "Item Master",
            route: "/dashboard/Master/Item/ItemMaster",
            icon: Boxes,
          },
        ],
      },

      Users: {
        icon: Users,
        items: [
          // {
          //   label: "User Master",
          //   route: "/dashboard/Master/User",
          //   icon: Users,
          // },
        ],
      },

      Role: {
        icon: Shield,
        items: [
          {
            label: "User Master",
            route: "/dashboard/Master/Role/UserMaster",
            icon: Shield,
          },
        ],
      },
    },

    RateEntry: {
      GoldRate: {
        icon: DollarSign,
        items: [
          {
            label: "Gold Rate",
            route: "/dashboard/Rate/Gold",
            icon: TrendingUp,
          },
        ],
      },
    },
    Accounts:{
      Opening :{
        icon: Layers,
        items: [
          {
            label: "Ornament Opening",
            route: "/dashboard/Accounts/Opening/Ornament",
            icon: Layers,
          },
        ],
      },
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
