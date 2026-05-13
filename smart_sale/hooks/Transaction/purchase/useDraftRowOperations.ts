// useDraftRowOperations.ts
import { useCallback } from "react";
import { usePurchaseTransactionStore } from "@/store/purchase/usePurchaseTransactionStore";
import {
    createEmptyRowForType,
    getDraftRowTempId,
    resetDraftRowTempId,
} from "@/utils/transaction/purchase/DraftRowsHandling";
import { TransactionType } from "@/types/transcation/Transaction";


export const useDraftRowOperations = (isTagedItem: (id: number) => boolean) => {
    const {
        draftRows,
        addDraftRow,
        updateDraftRow,
        removeDraftRow,
        setEditingState,
        editingState,
      
    } = usePurchaseTransactionStore();

    /**
     * Called for NEW rows only (formData has no permanent __rowId).
     * The table passes submitData which may carry _stones, _misc etc.
     */
    const handleAddRow = useCallback(
        (transactionType: TransactionType, formData?: any) => {
            if (!formData) {
                // ── Navigation blank row — guard against double-blank ─────────────
                const existingRows = draftRows.filter(
                    (r) => r.TRANSACTION_TYPE === transactionType.value
                );
                const last = existingRows[existingRows.length - 1];
                const lastIsBlank = !last?.ITEMID && !last?.PUREID
                    && !last?.WT && !last?.GRSWT;

                if (lastIsBlank) return; // already has a blank trailing row, do nothing

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

            // ── Real row commit — reuse existing __rowId from draft ───────────────
            const rowId = formData.__rowId;

            const isTagged = formData.ITEMID
                ? isTagedItem(Number(formData.ITEMID))
                : false;

            const ITEM_TYPE = isTagged ? "TAGED" : "NON_TAGED";

            const newRow = {
                ...formData,
                __rowId: rowId,
                __isTaged: isTagged,
                ITEM_TYPE,
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

            return { type: "new", rowId: rowId, row: newRow };
        },
        [addDraftRow, setEditingState, draftRows, isTagedItem]
    );

    /**
     * Called for EDITS only — replaces an existing row by its __rowId.
     * submitData comes from DraftTransactionTable's handleSubmit.
     */
    const handleEditRow = useCallback(
        (rowId: string, submitData: any) => {
            const isTagged = submitData.ITEMID
                ? isTagedItem(Number(submitData.ITEMID))
                : false;
            const ITEM_TYPE = isTagged ? "TAGGED" : "NON_TAGGED";
            updateDraftRow(rowId, {
                ...submitData,
                __rowId: rowId, // ensure ID is never overwritten
                __isTaged:isTagged,
                ITEM_TYPE
            });
            setEditingState({ rowId: null, transactionType: null });
        },
        [updateDraftRow, setEditingState ,isTagedItem]
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