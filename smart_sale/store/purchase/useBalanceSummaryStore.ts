import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PurchaseClosingFormDetails, BankTransaction } from '@/types/balanceSummary/BalanceSummary';

type BankModalType = "paid" | "received" | null;

type PurchaseBalanceSummaryStore = {
    // =====================
    // STATE
    // =====================
    closingDetails: PurchaseClosingFormDetails;
    bankModalType: BankModalType;

    // =====================
    // ACTIONS
    // =====================
  
    setClosingDetails: (data: Partial<PurchaseClosingFormDetails>) => void;

    setClosingField: <K extends keyof PurchaseClosingFormDetails>(
        field: K,
        value: PurchaseClosingFormDetails[K]
    ) => void;

    openBankModal: (type: Exclude<BankModalType, null>) => void;
    closeBankModal: () => void;

    setBankPaid: (transactions: BankTransaction[]) => void;
    setBankRcvd: (transactions: BankTransaction[]) => void;

    resetBalance: () => void;
};

const initialClosingDetails: PurchaseClosingFormDetails = {
    convType: "",
    convAmt: "",
    convWt: "",
    cashPaid: "",
    cashRcvd: "",
    bankPaid: "",
    bankRcvd: "",
    bankPaidDetails: [],
    bankRcvdDetails: [],
};

export const usePurchaseBalanceSummary = create<PurchaseBalanceSummaryStore>()(
    persist(
        (set) => ({
            // =====================
            // STATE
            // =====================
            closingDetails: initialClosingDetails,
            bankModalType: null,

            // =====================
            // UPDATE SINGLE FIELD (STRICT TYPING)
            // =====================
            setClosingDetails: (data) =>
                set((state) => ({
                    closingDetails: {
                        ...state.closingDetails,
                        ...data,
                    },
                })),
                
            setClosingField: (field, value) =>
                set((state) => ({
                    closingDetails: {
                        ...state.closingDetails,
                        [field]: value,
                    },
                })),

            // =====================
            // MODAL
            // =====================
            openBankModal: (type) => set({ bankModalType: type }),
            closeBankModal: () => set({ bankModalType: null }),

            // =====================
            // BANK PAID
            // =====================
            setBankPaid: (transactions) =>
                set((state) => ({
                    closingDetails: {
                        ...state.closingDetails,
                        bankPaidDetails: transactions,
                        bankPaid: transactions
                            .reduce((sum, t) => sum + Number(t.amount || 0), 0)
                            .toFixed(2),
                    },
                })),

            // =====================
            // BANK RECEIVED
            // =====================
            setBankRcvd: (transactions) =>
                set((state) => ({
                    closingDetails: {
                        ...state.closingDetails,
                        bankRcvdDetails: transactions,
                        bankRcvd: transactions
                            .reduce((sum, t) => sum + Number(t.amount || 0), 0)
                            .toFixed(2),
                    },
                })),

            // =====================
            // RESET
            // =====================
            resetBalance: () =>
                set({
                    closingDetails: initialClosingDetails,
                    bankModalType: null,
                }),
        }),
        {
            name: "purchase-balance-summary-storage",
        }
    )
);