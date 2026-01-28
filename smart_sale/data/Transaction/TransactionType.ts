import {
    ArrowUpRight,
    ShoppingCart,
    Wallet,
    RotateCcw,
} from "lucide-react";

export const TRANSACTIONTYPES = [
    {
        label: "ISSUE",
        value: "ISP",
        icon: ArrowUpRight,
    },
    {
        label: "PURCHASE",
        value: "SAP",
        icon: ShoppingCart,
    },
    {
        label: "RECEIPT",
        value: "REP",
        icon: Wallet,
    },
    {
        label: "RETURN",
        value: "SRP",
        icon: RotateCcw,
    },
];

export const SALETRANSACTIONTYPES = [
    {
        label: "ISSUE",
        value: "IS",
        icon: ArrowUpRight,
    },
    {
        label: "SALES",
        value: "SA",
        icon: ShoppingCart,
    },
    {
        label: "RECEIPT",
        value: "RE",
        icon: Wallet,
    },
    {
        label: "SALES RETURN",
        value: "SR",
        icon: RotateCcw,
    },
];
