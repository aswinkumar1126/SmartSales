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
  
    CONVTYPE: "",
    CONVAMT: "",
    CONVWT: "",
    DISCAMT:"",
    DISCWT: "",
    GSTAMT:"",
    GSTPER:"",
    TDSPER:"",
    TDSAMT:"",
    CASHPAID: "",
    CASHRCVD: "",
    BANKPAID: "",
    BANKRCVD: "",
    BANKPAIDDETAILS: [],
    BANKRCVDDETAILS: [],
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
            setClosingField: (field, value) => {
                if (field !== field.toUpperCase()) {
                    console.warn("❌ Invalid field key:", field);
                    return;
                }

                set((state) => ({
                    closingDetails: {
                        ...state.closingDetails,
                        [field]: value,
                    },
                }));
            },

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
                        BANKPAIDDETAILS: transactions,
                        BANKPAID: transactions
                            .reduce((sum, t) => sum + Number(t.AMOUNT || 0), 0)
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
                        BANKRCVDDETAILS: transactions,
                        BANKRCVD: transactions
                            .reduce((sum, t) => sum + Number(t.AMOUNT || 0), 0)
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