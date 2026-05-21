// store/useSalesHeader.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PurchaseHeaderState, PurchaseHeaderForm } from '@/types/TransactionTypes/purchase/PurchaseHeaderType';

type PurchaseHeaderActions = {
    setHeaderField: <K extends keyof PurchaseHeaderForm>(
        field: K,
        value: PurchaseHeaderForm[K]
    ) => void;

    setHeaderForm: (data: Partial<PurchaseHeaderForm>) => void;

    setCustomer: (value: string, label: string) => void; // ✅ ADD THIS

    setAccCode: (code: number | null) => void;

    startEdit: (sno: string) => void;
    stopEdit: () => void;

    startModifying: () => void;   // add this
    stopModifying: () => void;    // add this

    resetHeader: () => void;
};

const initialHeader: PurchaseHeaderForm = {
    CUSTOMER: "",
    CUSTOMER_NAME: "",
    DATE: new Date().toISOString().split("T")[0],
    BILLNO: "",
    ENTRYNO: "",
    RATEGM: "",
    METALTYPE: "G",
    REMARK : "",
    THRU:"",
};

export const usePurchaseHeader = create<PurchaseHeaderState & PurchaseHeaderActions>()(
    persist(
        (set) => ({
            // STATE
            headerForm: initialHeader,
            accCode: null,
            isEditing: false,
            isModifying :false,
            editingSno: null,
            selectedTransactionId: null,

            // ACTIONS
            setHeaderField: (field, value) =>
                set((state) => ({
                    headerForm: {
                        ...state.headerForm,
                        [field]: value,
                    },
                })),

            setHeaderForm: (data) =>
                set((state) => ({
                    headerForm: {
                        ...state.headerForm,
                        ...data,
                    },
                })),

            setCustomer: (value, label) =>
                set((state) => ({
                    headerForm: {
                        ...state.headerForm,
                        CUSTOMER: value,
                        CUSTOMER_NAME: label,
                        DATE: new Date().toISOString().split("T")[0], // optional reset
                        BILLNO: "",
                    },
                    accCode: value ? Number(value) : null,
                })),


            setAccCode: (code) => set({ accCode: code }),

            startEdit: (sno) =>
                set({
                    isEditing: true,
                    editingSno: sno,
                    selectedTransactionId: sno,
                }),

            stopEdit: () =>
                set({
                    isEditing: false,
                    editingSno: null,
                    selectedTransactionId: null,
                }),
            startModifying : () =>
                set({
                    isModifying :true
                }),
            stopModifying: () =>
                set({
                    isModifying: false
                }),

            resetHeader: () =>
                set({
                    headerForm: initialHeader,
                    accCode: null,
                    isEditing: false,
                    isModifying :false,
                    editingSno: null,
                    selectedTransactionId: null,
                }),
        }),
        {
            name: "purchase-header-storage",
        }
    )
);