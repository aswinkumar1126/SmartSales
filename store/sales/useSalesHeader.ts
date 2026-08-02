// store/useSalesHeader.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SalesHeaderState, SalesHeaderForm} from '@/types/TransactionTypes/sales/SaleHeaderType';

type SalesHeaderActions = {
    setHeaderField: <K extends keyof SalesHeaderForm>(
        field: K,
        value: SalesHeaderForm[K]
    ) => void;

    setHeaderForm: (data: Partial<SalesHeaderForm>) => void;

    setCustomer: (value: string, label: string) => void; // ✅ ADD THIS

    setAccCode: (code: number | null) => void;

    startEdit: (sno: string) => void;
    stopEdit: () => void;

    startModify :() => void ,
    stopModify :() => void ,

    resetHeader: () => void;
};

const initialHeader: SalesHeaderForm = {
    CUSTOMER: "",
    CUSTOMER_NAME: "",
    DATE: new Date().toISOString().split("T")[0],
    BILLNO: "",
    ENTRYNO: "",
    RATEGM: "",
    REMARK:"",
    THRU:""
};

export const useSalesHeader = create<SalesHeaderState & SalesHeaderActions>()(
    persist(
        (set) => ({
            // STATE
            headerForm: initialHeader,
            accCode: null,
            isEditing: false,
            editingSno: null,
            selectedTransactionId: null,
            isModifying :false,

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
            
            startModify: () =>
                set({
                    isModifying: true
                }),
            stopModify: () =>
                set({
                    isModifying: false
                }),

            resetHeader: () =>
                set({
                    headerForm: initialHeader,
                    accCode: null,
                    isEditing: false,
                    editingSno: null,
                    selectedTransactionId: null,
                    isModifying:false,
                }),
        }),
        {
            name: "sales-header-storage",
        }
    )
);