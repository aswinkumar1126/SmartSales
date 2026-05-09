// useDraftRowOperations.ts
import { useCallback } from "react";
import { useSaleTransactionStore } from "@/store/sales/useSaleTransactionStore";
import {
    createEmptyRowForType,
    getDraftRowTempId,
    resetDraftRowTempId,
} from "@/utils/transaction/sales/DraftRowsHandling";
import { SaleTransactionType } from "@/types/transcation/SaleTransaction";

export const useDraftRowOperations = (isTagedItem: (id: number) => boolean) => {
    const {
        draftRows,
        addDraftRow,
        updateDraftRow,
        removeDraftRow,
        setEditingState,
        editingState,
    } = useSaleTransactionStore();

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

            const isTagged = formData.ITEMID
                ? isTagedItem(Number(formData.ITEMID))
                : false;

            const ITEM_TYPE = isTagged ? "TAGGED" : "NON_TAGGED";

            const newRow = {
                ...formData,
                __rowId: permanentId,
                __isTaged: isTagged,
                ITEM_TYPE,
                __isNew: false,
                __previewSno:
                    useSaleTransactionStore.getState().draftRows.filter(
                        (r) => r.TRANSACTION_TYPE === transactionType.value
                    ).length + 1,
                TRANSACTION_TYPE: transactionType.value,
            };

            addDraftRow(newRow);
            setEditingState({ rowId: null, transactionType: null });
            resetDraftRowTempId();

            return { type: "new", rowId: permanentId, row: newRow };
        },
        [addDraftRow, setEditingState, isTagedItem]  // ✅ removed draftRows — using getState()
    );

    const handleEditRow = useCallback(
        (rowId: string, submitData: any) => {
            const isTagged = submitData.ITEMID
                ? isTagedItem(Number(submitData.ITEMID))
                : false;
            const ITEM_TYPE = isTagged ? "TAGGED" : "NON_TAGGED";
            updateDraftRow(rowId, {
                ...submitData,
                __rowId: rowId,
                __isTaged: isTagged,
                ITEM_TYPE,
            });
            setEditingState({ rowId: null, transactionType: null });
        },
        [updateDraftRow, setEditingState, isTagedItem]
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

    // ✅ Now takes rowId directly — no index, no typeRows needed
    const handleUpdateRow = useCallback(
        (rowId: string, field: string, value: any) => {
            if (!rowId) return;
            updateDraftRow(rowId, { [field]: value });
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