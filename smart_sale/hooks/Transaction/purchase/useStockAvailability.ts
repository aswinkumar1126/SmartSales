// hooks/useStockAvailability.ts (UPDATED)
import { useCallback, useMemo } from 'react';
import { TransactionKey, TRANSACTION_KEY_MAP } from "@/types/transcation/Transaction";
import { useEditStockCalculator } from './useEditStockCalculator';

interface UseStockAvailabilityDeps {
    transactionCode: string;
    pureStockList: any[];
    itemsStockList: any[];
    draftRows: any[];
    TRANSACTIONTYPES: any[];
    // Add this for edit mode
    isEditMode?: boolean;
    originalTransactionData?: any;
}

export interface StockAvailabilityOptions {
    excludeRowId?: string;
    isEditing?: boolean;
    originalValue?: number;
}

export interface QuantityDetail {
    total: number;
    used: number;
    remaining: number;
    originalUsed?: number; // Add this for edit mode clarity
}

export interface StockAvailability {
    stock: any;
    stockSource: 'pure' | 'items';
    transactionKey: TransactionKey;
    isIssue: boolean;
    isSales: boolean;
    isSalesReturn: boolean;
    isReceipt: boolean;
    weight: QuantityDetail;
    pieces: QuantityDetail;
    total: number;
    used: number;
    remaining: number;
    usedPieces: number;
    remainingPieces: number;
    // Edit mode specific
    isEditMode?: boolean;
    originalUsage?: number;
}

export interface ValidateOptions {
    field: 'WT' | 'PIECES' | 'NETWT';
    excludeRowId?: string;
    originalValue?: number;
}

export function useStockAvailability({
    transactionCode,
    pureStockList,
    itemsStockList,
    draftRows,
    TRANSACTIONTYPES,
    isEditMode = false,
    originalTransactionData,
}: UseStockAvailabilityDeps) {

    // Initialize edit calculator if in edit mode
    const editCalculator = useEditStockCalculator({
        pureStockList,
        itemsStockList,
        draftRows,
        originalTransactionData,
        TRANSACTIONTYPES,
    });

    const transactionKey = TRANSACTION_KEY_MAP[transactionCode];
    const isIssue = transactionKey === 'issue';
    const isSales = transactionKey === 'purchase';
    const isSalesReturn = transactionKey === 'purchase_return';
    const isReceipt = transactionKey === 'receipt';

    const getUsedQuantityById = useCallback((id: string | number, options?: {
        excludeRowId?: string,
        transactionTypeCode?: string,
        field?: 'WT' | 'PCS' | 'NETWT'
    }) => {
        const pureIdStr = String(id);
        const { excludeRowId, transactionTypeCode, field = 'WT' } = options || {};

        const filteredRows = draftRows.filter(row => {
            if (excludeRowId && row.__rowId === excludeRowId) return false;
            if (String(row.PUREID || row.ITEMID) !== pureIdStr) return false;

            const transactionType = TRANSACTIONTYPES.find(
                t => t.value === row.TRANSACTION_TYPE
            );
            if (!transactionType) return false;

            if (transactionTypeCode && transactionType.value !== transactionTypeCode) {
                return false;
            }

            return true;
        });

        return filteredRows.reduce((sum, row) => {
            return sum + (Number(row[field]) || 0);
        }, 0);
    }, [draftRows, TRANSACTIONTYPES]);

    const getStockAvailability = useCallback(
        (
            id: string | number | null,
            options?: StockAvailabilityOptions
        ): StockAvailability | undefined => {
            if (!id) return undefined;

            const { excludeRowId, originalValue } = options ?? {};

            let stock: any = null;
            let totalAvailableWeight = 0;
            let totalAvailablePieces = 0;
            let stockSource: 'pure' | 'items';
            let originalUsage = 0;

            if (isIssue || isReceipt) {
                stock = pureStockList.find((s) => String(s.pureId) === String(id));
                if (!stock) return undefined;
                totalAvailableWeight = Number(stock.weight ?? 0);
                stockSource = 'pure';

                // For edit mode, get original usage from transaction being edited
                if (isEditMode && originalTransactionData) {
                    originalUsage = editCalculator.getOriginalUsage(String(id), 'WT', 'ISP');
                }
            } else if (isSales || isSalesReturn) {
                stock = itemsStockList.find(
                    (s) =>
                        String(s.itemId) === String(id) ||
                        String(s.pureId) === String(id)
                );
                if (!stock) return undefined;
                totalAvailablePieces = Number(stock.pcs ?? stock.pieces ?? stock.quantity ?? 0);
                totalAvailableWeight = Number(stock.netwt ?? stock.netWeight ?? stock.purewt ?? 0);
                stockSource = 'items';

                // For edit mode, get original usage from transaction being edited
                if (isEditMode && originalTransactionData) {
                    originalUsage = editCalculator.getOriginalUsage(String(id), 'NETWT', 'PU');
                }
            } else {
                return undefined;
            }

            const dbCode = isIssue || isReceipt ? 'ISP' : 'PU';

            let usedWeight = getUsedQuantityById(id, {
                excludeRowId,
                transactionTypeCode: dbCode,
                field: isIssue || isReceipt ? 'WT' : 'NETWT',
            });

            const usedPieces = getUsedQuantityById(id, {
                excludeRowId,
                transactionTypeCode: dbCode,
                field: 'PCS',
            });

            // Apply edit mode calculation
            let weightRemaining: number;
            let piecesRemaining: number;

            if (isEditMode) {
                // Edit mode formula: Base Stock + Original - Current Draft
                weightRemaining = Math.max(totalAvailableWeight + originalUsage - usedWeight, 0);
                piecesRemaining = Math.max(totalAvailablePieces + (isSales || isSalesReturn ? originalUsage : 0) - usedPieces, 0);
            } else {
                // Normal mode formula: Base Stock - Current Draft
                weightRemaining = Math.max(totalAvailableWeight - usedWeight, 0);
                piecesRemaining = Math.max(totalAvailablePieces - usedPieces, 0);
            }

            return {
                stock,
                stockSource,
                transactionKey,
                isIssue,
                isSales,
                isSalesReturn,
                isReceipt,
                weight: {
                    total: totalAvailableWeight,
                    used: usedWeight,
                    remaining: weightRemaining,
                    originalUsed: isEditMode ? originalUsage : undefined
                },
                pieces: {
                    total: totalAvailablePieces,
                    used: usedPieces,
                    remaining: piecesRemaining
                },
                total: totalAvailableWeight,
                used: usedWeight,
                remaining: weightRemaining,
                usedPieces,
                remainingPieces: piecesRemaining,
                isEditMode,
                originalUsage: isEditMode ? originalUsage : undefined,
            };
        },
        [
            pureStockList,
            itemsStockList,
            getUsedQuantityById,
            isIssue,
            isSales,
            isSalesReturn,
            isReceipt,
            transactionKey,
            isEditMode,
            originalTransactionData,
            editCalculator,
        ]
    );

    const getAvailableWeight = useCallback(
        (id: string | number | null, options?: StockAvailabilityOptions) =>
            getStockAvailability(id, options)?.weight.remaining ?? null,
        [getStockAvailability]
    );

    const getAvailablePieces = useCallback(
        (pureId: string | number | null, options?: StockAvailabilityOptions) =>
            getStockAvailability(pureId, options)?.pieces.remaining ?? null,
        [getStockAvailability]
    );

    const validateQuantity = useCallback(
        (
            pureId: string | number | null,
            value: number,
            options: ValidateOptions
        ): boolean => {
            if (!pureId) return true;

            const availability = getStockAvailability(pureId, {
                excludeRowId: options.excludeRowId,
                originalValue: options.originalValue,
            });
            if (!availability) return true;

            const { field } = options;

            if (isIssue || isReceipt) {
                if (field === 'WT') return value <= availability.weight.remaining;
                if (field === 'PIECES') return value <= availability.pieces.remaining;
            }

            if (isSales || isSalesReturn) {
                if (field === 'NETWT') return value <= availability.weight.remaining;
                if (field === 'PIECES') return value <= availability.pieces.remaining;
            }

            return false;
        },
        [getStockAvailability, isIssue, isReceipt, isSales, isSalesReturn]
    );

    const getStockForTransaction = useCallback(
        (pureId: string | number) => {
            if (isIssue || isReceipt) {
                return pureStockList.find(
                    (s) => String(s.pureId) === String(pureId)
                ) ?? null;
            }
            if (isSales || isSalesReturn) {
                return itemsStockList.find(
                    (s) =>
                        String(s.itemId) === String(pureId) ||
                        String(s.pureId) === String(pureId)
                ) ?? null;
            }
            return null;
        },
        [pureStockList, itemsStockList, isIssue, isReceipt, isSales, isSalesReturn]
    );

    return {
        transactionKey,
        isIssue,
        isSales,
        isSalesReturn,
        isReceipt,
        getStockAvailability,
        getAvailableWeight,
        getAvailablePieces,
        validateQuantity,
        getStockForTransaction,
        // Expose edit calculator methods for direct access if needed
        ...(isEditMode && {
            getEditAvailableWeightForIS: (pureId: string) => editCalculator.getAvailableWeightForISP(pureId),
            getEditAvailableWeightForSA: (itemId: string) => editCalculator.getAvailableWeightForPU(itemId),
        }),
    };
}