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
  title?: string;
  description?:string;
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
  title?:string;
  description?: string;
};

export type ParentMenuItem = {
  title?: string;
  description?: string;
  type: "parent";
  label: string;
  icon: React.ElementType;
  children: ChildMenuItem[];
};

export type ChildMenuItem = {
  title?: string;
  description?: string;
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
  currentSection: string|null;
  setCurrentSection: (section: string) => void;
  multiWindow: boolean ;
  handleMultiWindow: () => void;
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
  Master: {
    Accounts: {
      icon: Building2,
      items: [
        {
          type: "direct",
          label: "Company",
          icon: Building2,
          route: "/dashboard/Master/Account/Company",
          title: "COMPANY MASTER",
          description: "Manage company details and configurations",
        },
        {
          type: "direct",
          label: "Account Head",
          route: "/dashboard/Master/Account/AccountHead",
          icon: Users,
          title: "ACCOUNT HEAD",
          description: "Manage account head and ledger groups",
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
          title: "METAL MASTER",
          description: "Define and manage metal types",
        },
        {
          type: "direct",
          label: "Item Master",
          route: "/dashboard/Master/Item/ItemMaster",
          icon: Boxes,
          title: "ITEM MASTER",
          description: "Manage all product/item details",
        },
        {
          type: "direct",
          label: "Touch Master",
          route: "/dashboard/Master/Item/touch",
          icon: SlidersHorizontal,
          title: "TOUCH MASTER",
          description: "Configure purity touch settings",
        },
        {
          type: "direct",
          label: "Pure Gold Master",
          route: "/dashboard/Master/Item/pureGold",
          icon: Gem,
          title: "PURE GOLD MASTER",
          description: "Manage pure gold configurations",
        },
        {
          type: "direct",
          label: "Other Charges",
          route: "/dashboard/Master/Item/OtherCharges",
          icon: PlusCircle,
          title: "OTHER CHARGES",
          description: "Manage additional charges and fees",
        },
        {
          type: "direct",
          label: "Size Master",
          route: "/dashboard/Master/Item/size",
          icon: Users,
          title: "SIZE MASTER",
          description: "Define item size standards",
        },
        {
          type: "direct",
          label: "Expense Master",
          route: "/dashboard/Master/Item/Expense",
          icon: Users,
          title: "EXPENSE MASTER",
          description: "Define Expense Name",
        },
      ],
    },

    Users: {
      icon: Users,
      items: [
        {
          type: "direct",
          label: "SOFT CONTROL",
          route: "/dashboard/Master/Users/SoftControl",
          icon: Settings,
          title: "Soft Control",
          description: "Manage system soft controls and settings",
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
          title: "USER MASTER",
          description: "Manage system users and roles",
        },
      ],
    },

    Mapping :{
      icon: Shield,
      items: [
      
      {
          type: "direct",
          label: "HMC Mapping",
          route: "/dashboard/Mapping/HmcMapping",
          icon: Users,
          title: "HMC MAPPING",
          description: "Manage HMC mappings",
        },


        {
          type: "direct",
          label: "Stone Mapping",
          route: "/dashboard/Mapping/StoneMapping",
          icon: Users,
          title: "STONE MAPPING",
          description: "Manage Stone Mapping",
        },
      ]
    }
  
  },

  RateEntry: {
    GoldRate: {
      type: "direct",
      label: "Gold Rate",
      route: "/dashboard/RateEntry",
      icon: TrendingUp,
      title: "GOLD RATE",
      description: "Update and manage gold rate entries",
    },
  },

  Accounts: {
    Opening: {
      icon: Layers,
      items: [
        {
          type: "direct",
          label: "Ornament Opening",
          route: "/dashboard/Accounts/Opening/Ornament",
          icon: Layers,
          title: "ORNAMENT OPENING",
          description: "Manage opening stock of ornaments",
        },
        {
          type: "direct",
          label: "Bank Account Master",
          route: "/dashboard/Accounts/Opening/bankAccount",
          icon: Landmark,
          title: "BANK ACCOUNT MASTER",
          description: "Manage bank account details",
        },
        {
          type: "direct",
          label: "Pure Gold Opening",
          route: "/dashboard/Accounts/Opening/pureGoldOpening",
          icon: Gem,
          title: "PURE GOLD OPENING",
          description: "Manage pure gold opening balances",
        },
      ],
    },
  },

  Transaction: {

    Purchase: {
      type: "direct",
      label: "Purchase",
      route: "/dashboard/Transaction/PurchasePage",
      icon: AiOutlineShoppingCart,
      title: "PURCHASE ENTRY",
      description: "Create and manage purchase transactions",
    },

    Barcode: {
      type: "direct",
      label: "Barcode Generate",
      route: "/dashboard/Transaction/BarCodeGenerate",
      icon: BadgeCheck,
      title: "BARCODE GENERATOR",
      description: "Generate and print item barcodes",
    },

  

    Sale: {
      type: "direct",
      label: "Sales",
      route: "/dashboard/Transaction/Sales",
      icon: AiOutlineDollar,
      title: "SALES ENTRY",
      description: "Create and manage sales transactions",
    },

    
    // Purchase: {
    //   type: "direct",
    //   label: "Purchase",
    //   route: "/dashboard/Transaction/Purchase",
    //   icon: AiOutlineShoppingCart,
    //   title: "PURCHASE ENTRY",
    //   description: "Create and manage purchase transactions",
    // },

    // Transaction: {
    //   icon: Layers,
    //   items: [
    //     {
    //       type: "parent",
    //       label: "Approval",
    //       icon: BadgeCheck,
    //       title: "Approval Module",
    //       description: "Approve or reject pending transactions",
    //       children: [
    //         {
    //           label: "Pending",
    //           route: "/dashboard/Transaction/Transaction/Approval/pending",
    //           icon: HiArrowDownCircle,
    //           title: "Pending Approvals",
    //           description: "View transactions waiting for approval",
    //         },
    //         {
    //           label: "Completed",
    //           route: "/dashboard/Transaction/Transaction/Approval/completed",
    //           icon: BadgeCheck,
    //           title: "Completed Approvals",
    //           description: "View approved transactions",
    //         },
    //       ],
    //     },
    //     {
    //       type: "direct",
    //       label: "Bank Transaction",
    //       route: "/dashboard/Transaction/Transaction/BankTransaction",
    //       icon: Landmark,
    //       title: "Bank Transaction",
    //       description: "Manage bank transactions",
    //     },
    //     
    //     {
    //       type: "direct",
    //       label: "Income",
    //       route: "/dashboard/Transaction/Transaction/Income",
    //       icon: TrendingUp,
    //       title: "Income",
    //       description: "Track income entries",
    //     },
    //   ],
    // },

    Settings: {
      icon: Settings,
      items: [
        {
          type: "direct",
          label: "Printer",
          route: "/dashboard/Settings/Printer",
          icon: Settings,
          title: "PRINTER SETTINGS",
          description: "Configure printing options",
        },
      ],
    },
    Expenses:{
      type: "direct",
      label: "Expenses",
      route: "/dashboard/Transaction/Expenses",
      icon: TrendingDown,
      title: "Expenses",
      description: "Track and manage expenses",
    },
  },

  Reports: {
         OutstandingReport : 
        {
          type: "direct",
          label: "Outstanding Report",
          route: "/dashboard/Reports/TagReport/OutstandingReport",
          icon: Layers,
          title: "  OUTSTANDING REPORT",
          description: "View stock   OUTSTANDING reports",
        },
      ITEMReport : 
        {
          type: "direct",
          label: "ITEM Stock Report",
          route: "/dashboard/Reports/TagReport/ItemStockReport",
          icon: Layers,
          title: "ITEM WISE STOCK REPORT",
          description: "View stock and item summary reports",
        },
    PUREReport: {
          type: "direct",
          label: "PURE Stock Report",
          route: "/dashboard/Reports/TagReport/PureStockReport",
          icon: Layers,
          title: "PURE WISE STOCK REPORT",
          description: "View stock and item summary reports",
        },
      
    ACHEADReport :{
          type: "direct",
          label: "Achead Stock Report",
          route: "/dashboard/Reports/TagReport/AcheadStockReport",
          icon: Layers,
          title: "ACHEAD STOCK REPORT",
          description: "View stock and item summary reports",
        },
      TRANReport:  {
          type: "direct",
          label: "Transaction Report",
          route: "/dashboard/Reports/TagReport/TranReport",
          icon: Layers,
          title: "TRANSACTION REPORT",
          description: "View Transaction summary reports",
        },
        AgeReport:  {
          type: "direct",
          label: "Age Report",
          route: "/dashboard/Reports/TagReport/AgeReport",
          icon: Layers,
          title: "AGE REPORT",
          description: "View Tagwise-age reports",
        },

        // {
        //   type: "direct",
        //   label: "DESIGNER Stock Report",
        //   route: "/dashboard/Reports/TagReport/",
        //   icon: Layers,
        //   title: "PURE WISE STOCK REPORT",
        //   description: "View stock and item summary reports",
        // },
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

/** localStorage key used to persist the sidebar collapsed state. */
const LS_COLLAPSED_KEY = "sidebar-collapsed";

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [menuData] = useState<SidebarMenu>(STATIC_MENU);

  const [multiWindow , setMultiWindow] = useState<boolean>(false);

  const [currentSection, _setCurrentSection] = useState<string|null>(null);


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

  const handleMultiWindow = () => {
    setMultiWindow(prev => !prev);
  };

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
        multiWindow,
        handleMultiWindow,
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