import {
    ArrowUpRight,
    ShoppingCart,
    Wallet,
    RotateCcw,
} from "lucide-react";
import { TransactionType } from "@/types/transcation/Transaction";

export const TRANSACTIONTYPES: TransactionType[] = [
    {
        code: "PU",
        key: "purchase",
        label: "PURCHASE",
        value: "PU",
        icon: ShoppingCart,
    },
    {
        code: "PR",
        key: "purchase_return",
        label: "RETURN",
        value: "PR",
        icon: RotateCcw,
    },
    {
        code: "ISP",
        key: "issue",
        label: "ISSUE",
        value: "ISP",
        icon: ArrowUpRight,
    },
    {
        code: "REC",
        key: "receipt",
        label: "RECEIPT",
        value: "REC",
        icon: Wallet,
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
