import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SaleTransactionType } from "@/types/transcation/SaleTransaction";

export interface DraftRow {
    __rowId: string;
    __isNew?: boolean;
    __tempId?: string;
    __previewSno?: number;
    TRANSACTION_TYPE: string;
    [key: string]: any;
}

interface SaleTransactionState {
    // Selected transaction types
    selectedTransactionTypes: SaleTransactionType[];

    // Draft rows
    draftRows: DraftRow[];

    // Editing state
    editingState: {
        rowId: string | null;
        transactionType: string | null;
    };

    // Selected transaction ID (for editing existing transactions)
    selectedTransactionId: string | null;

    // Actions
    setSelectedTransactionTypes: (types: SaleTransactionType[]) => void;
    addTransactionType: (type: SaleTransactionType) => void;
    removeTransactionType: (typeValue: string) => void;
    clearAllTransactionTypes: () => void;

    setDraftRows: (rows: DraftRow[] | ((prev: DraftRow[]) => DraftRow[])) => void;
    addDraftRow: (row: DraftRow) => void;
    updateDraftRow: (rowId: string, updates: Partial<DraftRow>) => void;
    removeDraftRow: (rowId: string) => void;
    clearDraftRows: () => void;
    clearDraftRowsByType: (transactionType: string) => void;

    setEditingState: (state: { rowId: string | null; transactionType: string | null }) => void;
    clearEditingState: () => void;

    setSelectedTransactionId: (id: string | null) => void;

    // Reset entire store
    resetStore: () => void;
}



export const useSaleTransactionStore = create<SaleTransactionState>()(
    persist(
        (set, get) => ({
            // Initial state
            selectedTransactionTypes: [],
            draftRows: [],
            editingState: { rowId: null, transactionType: null },
            selectedTransactionId: null,

            // Selected Transaction Types Actions
            setSelectedTransactionTypes: (types) => {
                set({ selectedTransactionTypes: types });
            },

            addTransactionType: (type) => {
                const { selectedTransactionTypes } = get();
                if (!selectedTransactionTypes.some(t => t.value === type.value)) {
                    set({ selectedTransactionTypes: [...selectedTransactionTypes, type] });
                }
            },

            removeTransactionType: (typeValue) => {
                const { selectedTransactionTypes } = get();
                set({
                    selectedTransactionTypes: selectedTransactionTypes.filter(
                        t => t.value !== typeValue
                    ),
                });
            },

            clearAllTransactionTypes: () => {
                set({ selectedTransactionTypes: [] });
            },

            // Draft Rows Actions
            setDraftRows: (rows) => {
                if (typeof rows === 'function') {
                    set((state) => ({ draftRows: rows(state.draftRows) }));
                } else {
                    set({ draftRows: rows });
                }
            },

            addDraftRow: (row) => {
                set((state) => ({
                    draftRows: [...state.draftRows, row],
                }));
            },

            updateDraftRow: (rowId, updates) => {
                set((state) => ({
                    draftRows: state.draftRows.map(row =>
                        row.__rowId === rowId
                            ? { ...row, ...updates }
                            : row
                    ),
                }));
            },

            removeDraftRow: (rowId) => {
                set((state) => ({
                    draftRows: state.draftRows.filter(row => row.__rowId !== rowId),
                }));
            },

            clearDraftRows: () => {
                set({ draftRows: [] });
            },

            clearDraftRowsByType: (transactionType) => {
                set((state) => ({
                    draftRows: state.draftRows.filter(
                        row => row.TRANSACTION_TYPE !== transactionType
                    ),
                }));
            },

            // Editing State Actions
            setEditingState: (state) => {
                set({ editingState: state });
            },

            clearEditingState: () => {
                set({ editingState: { rowId: null, transactionType: null } });
            },

            // Selected Transaction ID
            setSelectedTransactionId: (id) => {
                set({ selectedTransactionId: id });
            },

            // Reset entire store
            resetStore: () => {
                set({
                    selectedTransactionTypes: [],
                    draftRows: [],
                    editingState: { rowId: null, transactionType: null },
                    selectedTransactionId: null,
                });
            },
        }),
        {
            name: "sale-transaction-storage",
            // storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                draftRows: state.draftRows,
                selectedTransactionTypes: state.selectedTransactionTypes,
            }),
        }
    )
);