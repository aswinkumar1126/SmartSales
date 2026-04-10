import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SalesClosingFormDetails, BankTransaction } from '@/types/balanceSummary/BalanceSummary';

type BankModalType = "paid" | "received" | null;

type SalesBalanceSummaryStore = {
    // =====================
    // STATE
    // =====================
    closingDetails: SalesClosingFormDetails;
    bankModalType: BankModalType;

    // =====================
    // ACTIONS
    // =====================
  
    setClosingDetails: (data: Partial<SalesClosingFormDetails>) => void;

    setClosingField: <K extends keyof SalesClosingFormDetails>(
        field: K,
        value: SalesClosingFormDetails[K]
    ) => void;

    openBankModal: (type: Exclude<BankModalType, null>) => void;
    closeBankModal: () => void;

    setBankPaid: (transactions: BankTransaction[]) => void;
    setBankRcvd: (transactions: BankTransaction[]) => void;

    resetBalance: () => void;
};

const initialClosingDetails: SalesClosingFormDetails = {
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

export const useSalesBalanceSummary = create<SalesBalanceSummaryStore>()(
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
            name: "sales-balance-summary-storage",
        }
    )
);