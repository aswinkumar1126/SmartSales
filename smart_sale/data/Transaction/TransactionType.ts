import {
    ArrowUpRight,
    ShoppingCart,
    Wallet,
    RotateCcw,
} from "lucide-react";

export const TRANSACTIONTYPES = [
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
