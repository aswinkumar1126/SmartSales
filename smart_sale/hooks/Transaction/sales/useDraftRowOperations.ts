// useDraftRowOperations.ts
import { useCallback } from "react";
import { useSaleTransactionStore } from "@/store/sales/useSaleTransactionStore";
import {
    createEmptyRowForType,
    getDraftRowTempId,
    resetDraftRowTempId,
} from "@/utils/transaction/sales/DraftRowsHandling";
import { SaleTransactionType } from "@/types/transcation/SaleTransaction";

export const useDraftRowOperations = () => {
    const {
        draftRows,
        addDraftRow,
        updateDraftRow,
        removeDraftRow,
        setEditingState,
        editingState,
    } = useSaleTransactionStore();

    /**
     * Called for NEW rows only (formData has no permanent __rowId).
     * The table passes submitData which may carry _stones, _misc etc.
     */
    const handleAddRow = useCallback(
        (transactionType: SaleTransactionType, formData?: any) => {
            if (!formData) {
                const tempId = getDraftRowTempId(transactionType.key);
                const newRow = {
                    ...createEmptyRowForType(transactionType),
                    __rowId: tempId,
                    __isNew: true,
                    __tempId: tempId,
                };
                addDraftRow(newRow);
                return;
            }

            const permanentId = `row-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 5)}`;

            const newRow = {
                ...formData,
                __rowId: permanentId,
                __isNew: false,
                __previewSno:
                    draftRows.filter(
                        (r) => r.TRANSACTION_TYPE === transactionType.value
                    ).length + 1,
                TRANSACTION_TYPE: transactionType.value,
            };

            addDraftRow(newRow);
            setEditingState({ rowId: null, transactionType: null });
            resetDraftRowTempId();

            return { type: "new", rowId: permanentId, row: newRow };
        },
        [addDraftRow, setEditingState, draftRows]
    );

    /**
     * Called for EDITS only — replaces an existing row by its __rowId.
     * submitData comes from DraftTransactionTable's handleSubmit.
     */
    const handleEditRow = useCallback(
        (rowId: string, submitData: any) => {
            updateDraftRow(rowId, {
                ...submitData,
                __rowId: rowId, // ensure ID is never overwritten
            });
            setEditingState({ rowId: null, transactionType: null });
        },
        [updateDraftRow, setEditingState]
    );

    const handleRemoveRow = useCallback(
        (rowId: string) => {
            removeDraftRow(rowId);
            if (editingState.rowId === rowId) {
                setEditingState({ rowId: null, transactionType: null });
            }
        },
        [removeDraftRow, editingState, setEditingState]
    );

    const handleUpdateRow = useCallback(
        (rowIndex: number, field: string, value: any, typeRows: any[]) => {
            const targetRow = typeRows[rowIndex];
            if (!targetRow) return;
            updateDraftRow(targetRow.__rowId, { [field]: value });
        },
        [updateDraftRow]
    );

    return {
        handleAddRow,
        handleEditRow,
        handleRemoveRow,
        handleUpdateRow,
    };
};