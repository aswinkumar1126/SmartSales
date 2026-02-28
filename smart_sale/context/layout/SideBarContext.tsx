"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import {
  Building2,
  Coins,
  Boxes,
  Users,
  Shield,
  TrendingUp,
  Layers,
  DollarSign,
  SlidersHorizontal,
   Gem,
  ShoppingCart,
  Banknote,
  BadgeCheck,
  Landmark,
  TrendingDown,
  PlusCircle
} from "lucide-react";
import { HiArrowDownCircle, HiArrowUpCircle } from "react-icons/hi2";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { AiOutlineDollar } from "react-icons/ai";
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

type SidebarContextType = {
  currentSection: string;
  setCurrentSection: (section: string) => void;
  expandedNodes: Record<string, boolean>;
  toggleNode: (key: string) => void;
  menuData: SidebarMenu;
  sidebarConfig: {
    collapsedWidth: string;
    expandedWidth: string;
  };
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  updateSidebarConfig?: (config: Partial<SidebarContextType['sidebarConfig']>) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
};

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
          {
            label: "AccountHead",
            route: "/dashboard/Master/Account/AccountHead",
            icon: Users,
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
          // {
          //   label: "Party Master",
          //   route: "/dashboard/Master/Item/party",
          //   icon: Users,
          // },
          {
            label: "Touch Master",
            route: "/dashboard/Master/Item/touch",
            icon: SlidersHorizontal,
          },
          {
            label: 'PureGold Master',
            route: '/dashboard/Master/Item/pureGold',
            icon: Gem
          },
          {
            label: "Other Charges",
            route: "/dashboard/Master/Item/OtherCharges",
            icon: PlusCircle,
          },
         
        ],
      },
      Users: {
        icon: Users,
        items: [],
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
    Accounts: {
      Opening: {
        icon: Layers,
        items: [
          {
            label: "Ornament Opening",
            route: "/dashboard/Accounts/Opening/Ornament",
            icon: Layers,
          },
          {
            label: "Bank Account Master",
            route: "/dashboard/Accounts/Opening/bankAccount",
            icon: Layers,
          },
          {
            label: 'PureGold Opening',
            route: '/dashboard/Accounts/Opening/pureGoldOpening',
            icon: Gem
          }
        ],
      },
    },
    Transaction :{
      Transaction:{
        icon: Layers,
        items:[
          {
            label: "Purchase",
            route: "/dashboard/Transaction/Transaction/Purchase",
            icon: AiOutlineShoppingCart,
          },
          {
            label: "Sales",
            route: "/dashboard/Transaction/Transaction/Sales",
            icon: AiOutlineDollar,
          },
          {
            label: "Approval",
            route: "/dashboard/Transaction/Transaction/Approval",
            icon: BadgeCheck,
          },
          {
            label: "Bank Transaction",
            route: "/dashboard/Transaction/Transaction/BankTransaction",
            icon: Landmark,
          },
          {
            label: "Expenses",
            route: "/dashboard/Transaction/Transaction/Expenses",
            icon: TrendingDown,
          },
          {
            label: "Income",
            route: "/dashboard/Transaction/Transaction/Income",
            icon: TrendingUp,
          },
          
        ]
      }

    }
   
  });

  const [currentSection, setCurrentSection] = useState("Master");
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [sidebarConfig, setSidebarConfig] = useState({
    collapsedWidth: "64px",
    expandedWidth: "260px",
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize collapsed state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem("sidebar-collapsed");
      const initialState = savedState === "true";
      setSidebarCollapsed(initialState);
      setIsInitialized(true);
    }
  }, []);

  const toggleNode = (key: string) => {
    setExpandedNodes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", newState.toString());
  };

  const updateSidebarConfig = (config: Partial<typeof sidebarConfig>) => {
    setSidebarConfig(prev => ({ ...prev, ...config }));
  };

  // Don't render children until initialized to avoid flash of incorrect layout
  if (!isInitialized) {
    return null;
  }

  return (
    <SidebarContext.Provider
      value={{
        currentSection,
        setCurrentSection,
        expandedNodes,
        toggleNode,
        menuData,
        sidebarConfig,
        sidebarCollapsed,
        toggleSidebar,
        updateSidebarConfig,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};