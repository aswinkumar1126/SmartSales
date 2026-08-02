import { ApprovalTransactionType } from "@/types/transcation/ApprovalTransaction";

export const APPROVAL_TRANSACTION_TYPES: ApprovalTransactionType[] = [
    { code: "APPIS", key: "APPROVAL_ISSUE", label: "Approval Issue", value: "APPIS" },
    { code: "APPRE", key: "APPROVAL_RECEIPT", label: "Approval REceipt", value: "APPRE" },
];

export const getTransactionTypeByCode = (
    code: string
): ApprovalTransactionType | undefined => {
    return APPROVAL_TRANSACTION_TYPES.find(t => t.code === code);
};