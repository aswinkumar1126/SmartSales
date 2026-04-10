import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ClosingFormDetails, BankTransaction } from '@/types/balanceSummary/BalanceSummary';

type BankModalType = "paid" | "received" | null;

type BalanceSummaryStore = {
    // =====================
    // STATE
    // =====================
    closingDetails: ClosingFormDetails;
    bankModalType: BankModalType;

    // =====================
    // ACTIONS
    // =====================
    setClosingField: <K extends keyof ClosingFormDetails>(
        field: K,
        value: ClosingFormDetails[K]
    ) => void;

    openBankModal: (type: Exclude<BankModalType, null>) => void;
    closeBankModal: () => void;

    setBankPaid: (transactions: BankTransaction[]) => void;
    setBankRcvd: (transactions: BankTransaction[]) => void;

    resetBalance: () => void;
};

const initialClosingDetails: ClosingFormDetails = {
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

export const useBalanceSummary = create<BalanceSummaryStore>()(
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
            name: "balance-summary-storage",
        }
    )
);