import { SaleTransactionType } from "@/types/transcation/SaleTransaction";

export const SALE_TRANSACTION_TYPES: SaleTransactionType[] = [
    { code: "SA", key: "sales", label: "Sales" , value:"SA" },
    { code: "SR", key: "sales_return", label: "Sales Return", value: "SR" },
    { code: "IS", key: "issue", label: "Issue", value: "IS" },
    { code: "RE", key: "receipt", label: "Receipt", value: "RE" },
];

export const getTransactionTypeByCode = (
    code: string
): SaleTransactionType | undefined => {
    return SALE_TRANSACTION_TYPES.find(t => t.code === code);
};