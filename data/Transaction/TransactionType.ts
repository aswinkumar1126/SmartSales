import {
    ArrowUpRight,
    ShoppingCart,
    Wallet,
    RotateCcw,
} from "lucide-react";
import { TransactionType } from "@/types/transcation/Transaction";
import { SaleTransactionType } from "@/types/transcation/SaleTransaction";
import { ApprovalTransactionType } from "@/types/transcation/ApprovalTransaction";

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

export const SALETRANSACTIONTYPES: SaleTransactionType[] = [
    {
        code: "IS",
        key: "issue",
        label: "ADD ISSUE",
        value: "IS",
        icon: ArrowUpRight,
    },
    {
        code: "SA",
        key: "sales",
        label: "ADD SALES",
        value: "SA",
        icon: ShoppingCart,
    },
    {
        code: "RE",
        key: "receipt",
        label: "ADD RECEIPT",
        value: "RE",
        icon: Wallet,
    },
    {
        code: "SR",
        key: "sales_return",
        label: "ADD SALES RETURN",
        value: "SR",
        icon: RotateCcw,
    },
];


export const APPROVALTRANSACTIONTYPES: ApprovalTransactionType[] = [
    {
        code: "APPIS",
        key: "APPROVAL_ISSUE",
        label: "APPROVAL ISSUE",
        value: "APPIS",
        icon: ArrowUpRight,
    },
    {
        code: "APPRE",
        key: "APPROVAL_RECEIPT",
        label: "APPROVAL RECEIPT",
        value: "APPRE",
        icon: ShoppingCart,
    },

];