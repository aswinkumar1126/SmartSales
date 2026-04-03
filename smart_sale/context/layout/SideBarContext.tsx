"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
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
  BadgeCheck,
  Landmark,
  TrendingDown,
  PlusCircle,
  Settings,
} from "lucide-react";
import { HiArrowDownCircle } from "react-icons/hi2";
import { AiOutlineShoppingCart, AiOutlineDollar } from "react-icons/ai";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

// A leaf route at section level (no group wrapper)
export type SectionDirectItem = {
  type: "direct";
  label: string;
  route: string;
  icon: React.ElementType;
};

// A group with icon and items
export type MenuGroup = {
  icon: React.ElementType;
  items: MenuItem[];
};

// Union type for section content - can be either a direct item or a group
export type SectionContent = MenuGroup | SectionDirectItem;

// Keep existing types
export type DirectMenuItem = {
  type: "direct";
  label: string;
  route: string;
  icon: React.ElementType;
};

export type ParentMenuItem = {
  type: "parent";
  label: string;
  icon: React.ElementType;
  children: ChildMenuItem[];
};

export type ChildMenuItem = {
  label: string;
  route: string;
  icon: React.ElementType;
};

export type MenuItem = DirectMenuItem | ParentMenuItem;

// Updated SidebarMenu - each section maps group names to SectionContent
export type SidebarMenu = Record<string, Record<string, SectionContent>>;

/** Sidebar visual configuration (widths can be overridden at runtime). */
export type SidebarConfig = {
  collapsedWidth: string;
  expandedWidth: string;
};

/** Everything a consumer component can read / call. */
export type SidebarContextType = {
  currentSection: string;
  setCurrentSection: (section: string) => void;
  expandedNodes: Record<string, boolean>;
  toggleNode: (key: string) => void;
  menuData: SidebarMenu;
  sidebarConfig: SidebarConfig;
  updateSidebarConfig: (config: Partial<SidebarConfig>) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = (): SidebarContextType => {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error(
      "[useSidebar] must be called inside <SidebarProvider>. " +
      "Wrap your layout root with <SidebarProvider>."
    );
  }
  return ctx;
};

const STATIC_MENU: SidebarMenu = {
  // ── Top-level section: Master ─────────────────────────────────────────────
  Master: {
    Accounts: {
      icon: Building2,
      items: [
        {
          type: "direct",
          label: "Company",
          icon: Building2,
          route: "/dashboard/Master/Account/Company",
        },
        {
          type: "direct",
          label: "Account Head",
          route: "/dashboard/Master/Account/AccountHead",
          icon: Users,
        },
      ],
    },
    Item: {
      icon: Boxes,
      items: [
        {
          type: "direct",
          label: "Metal",
          route: "/dashboard/Master/Item/Metal",
          icon: Coins,
        },
        {
          type: "direct",
          label: "Item Master",
          route: "/dashboard/Master/Item/ItemMaster",
          icon: Boxes,
        },
        {
          type: "direct",
          label: "Touch Master",
          route: "/dashboard/Master/Item/touch",
          icon: SlidersHorizontal,
        },
        {
          type: "direct",
          label: "Pure Gold Master",
          route: "/dashboard/Master/Item/pureGold",
          icon: Gem,
        },
        {
          type: "direct",
          label: "Other Charges",
          route: "/dashboard/Master/Item/OtherCharges",
          icon: PlusCircle,
        },
        {
          type: "direct",
          label: "Size Master",
          route: "/dashboard/Master/Item/size",
          icon: Users,
        },
      ],
    },
    Users: {
      icon: Users,
      items: [
        {
          type: "direct",
          label: "Soft Control",
          route: "/dashboard/Master/Users/SoftControl",
          icon: Settings,
        },
      ],
    },
    Role: {
      icon: Shield,
      items: [
        {
          type: "direct",
          label: "User Master",
          route: "/dashboard/Master/Role/UserMaster",
          icon: Shield,
        },
      ],
    },
  },

  // ── Top-level section: Rate Entry ─────────────────────────────────────────
  RateEntry: {
    GoldRate: {
      type: "direct",
      label: "Gold Rate",
      route: "/dashboard/RateEntry",
      icon: TrendingUp,
    },
  },

  // ── Top-level section: Accounts ───────────────────────────────────────────
  Accounts: {
    Opening: {
      icon: Layers,
      items: [
        {
          type: "direct",
          label: "Ornament Opening",
          route: "/dashboard/Accounts/Opening/Ornament",
          icon: Layers,
        },
        {
          type: "direct",
          label: "Bank Account Master",
          route: "/dashboard/Accounts/Opening/bankAccount",
          icon: Landmark,
        },
        {
          type: "direct",
          label: "Pure Gold Opening",
          route: "/dashboard/Accounts/Opening/pureGoldOpening",
          icon: Gem,
        },
      ],
    },
  },

  // ── Top-level section: Transaction ────────────────────────────────────────
  Transaction: {
    // Direct item without group wrapper
    Purchase: {
      type: "direct",
      label: "Purchase",
      route: "/dashboard/Transaction/Purchase",
      icon: AiOutlineShoppingCart,
    },
     Barcode:{
        type: "direct",
        label: "Barcode Generate",
        route: "/dashboard/Transaction/BarCodeGenerate",
        icon: BadgeCheck,
        },
    Sale: {
      type: "direct",
      label: "Sales",
      route: "/dashboard/Transaction/Sales",
      icon: AiOutlineDollar,
    },

    // Regular group with icon and items
    Transaction: {
      icon: Layers,
      items: [
       
       
        {
          type: "parent",
          label: "Approval",
          icon: BadgeCheck,
          children: [
            {
              label: "Pending",
              route: "/dashboard/Transaction/Transaction/Approval/pending",
              icon: HiArrowDownCircle,
            },
            {
              label: "Completed",
              route: "/dashboard/Transaction/Transaction/Approval/completed",
              icon: BadgeCheck,
            },
          ],
        },
        {
          type: "direct",
          label: "Bank Transaction",
          route: "/dashboard/Transaction/Transaction/BankTransaction",
          icon: Landmark,
        },
        {
          type: "direct",
          label: "Expenses",
          route: "/dashboard/Transaction/Transaction/Expenses",
          icon: TrendingDown,
        },
        {
          type: "direct",
          label: "Income",
          route: "/dashboard/Transaction/Transaction/Income",
          icon: TrendingUp,
        },
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

/** localStorage key used to persist the sidebar collapsed state. */
const LS_COLLAPSED_KEY = "sidebar-collapsed";

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [menuData] = useState<SidebarMenu>(STATIC_MENU);

  
  const [currentSection, _setCurrentSection] = useState<string>("Master");

  
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(
    {}
  );

  const [sidebarConfig, setSidebarConfig] = useState<SidebarConfig>({
    collapsedWidth: "64px",
    expandedWidth: "260px",
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate sidebar-collapsed state from localStorage once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(LS_COLLAPSED_KEY);
    if (stored !== null) setSidebarCollapsed(stored === "true");
    setIsHydrated(true);
  }, []);

 
  const setCurrentSection = useCallback(
    (section: string) => {
      _setCurrentSection((prev) => (prev === section ? "" : section));
      setExpandedNodes({});
    },
    []
  );

  const toggleNode = useCallback((key: string) => {
    setExpandedNodes((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(LS_COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  const updateSidebarConfig = useCallback(
    (config: Partial<SidebarConfig>) => {
      setSidebarConfig((prev) => ({ ...prev, ...config }));
    },
    []
  );

  if (!isHydrated) return null;

  return (
    <SidebarContext.Provider
      value={{
        currentSection,
        setCurrentSection,
        expandedNodes,
        toggleNode,
        menuData,
        sidebarConfig,
        updateSidebarConfig,
        sidebarCollapsed,
        toggleSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};