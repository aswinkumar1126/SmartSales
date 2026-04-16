// hooks/useStockAvailability.ts (UPDATED)
import { useCallback, useMemo } from 'react';
import { TransactionKey, TRANSACTION_KEY_MAP } from "@/types/transcation/Transaction";
import { useEditStockCalculator } from './useEditStockCalculator';

interface UseStockAvailabilityDeps {
    transactionCodes: string[];
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
    transactionKeys: Set<TransactionKey>;
    isIssue: boolean;
    isPurchase: boolean;
    isPurchaseReturn: boolean;
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
    transactionCodes,
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

    const transactionKeys = new Set(
        transactionCodes.map(code => TRANSACTION_KEY_MAP[code])
    );
   

    const isIssue = transactionKeys.has('issue');
    const isReceipt = transactionKeys.has('receipt');
    const isPurchase = transactionKeys.has('purchase');
    const isPurchaseReturn = transactionKeys.has('purchase_return');
   

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
                
                // For edit mode, get original usage from transaction being edited
                if (isEditMode && originalTransactionData) {
                    originalUsage = editCalculator.getOriginalUsage(String(id), 'WT', 'ISP');
           
                }


                totalAvailableWeight = Number(stock.weight ?? 0) + Number(originalUsage);
                stockSource = 'pure';


             
            } else if (isPurchase || isPurchaseReturn) {
                stock = itemsStockList.find(
                    (s) =>
                        String(s.itemId) === String(id) ||
                        String(s.pureId) === String(id)
                );
                if (!stock) return undefined;

                // For edit mode, get original usage from transaction being edited
                if (isEditMode && originalTransactionData) {
                    originalUsage = editCalculator.getOriginalUsage(String(id), 'NETWT', 'PU');
                }
                
                totalAvailablePieces = Number(stock.pcs ?? stock.pieces ?? stock.quantity ?? 0);
                totalAvailableWeight = Number(stock.netwt ?? stock.netWeight ?? stock.purewt ?? 0) + Number(originalUsage) ;

              
                stockSource = 'items';

               
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
                weightRemaining = Math.max(totalAvailableWeight - usedWeight, 0);
                piecesRemaining = Math.max(totalAvailablePieces + (isPurchase || isPurchaseReturn ? originalUsage : 0) - usedPieces, 0);
            } else {
                // Normal mode formula: Base Stock - Current Draft
                weightRemaining = Math.max(totalAvailableWeight - usedWeight, 0);
                piecesRemaining = Math.max(totalAvailablePieces - usedPieces, 0);
            }

            return {
                stock,
                stockSource,
                transactionKeys,
                isIssue,
                isPurchase,
                isPurchaseReturn,
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
            isPurchase,
            isPurchaseReturn,
            isReceipt,
            transactionKeys,
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

            if (isPurchase || isPurchaseReturn) {
                if (field === 'NETWT') return value <= availability.weight.remaining;
                if (field === 'PIECES') return value <= availability.pieces.remaining;
            }

            return false;
        },
        [getStockAvailability, isIssue, isReceipt, isPurchase, isPurchaseReturn]
    );

    const getStockForTransaction = useCallback(
        (pureId: string | number) => {
            if (isIssue || isReceipt) {
                return pureStockList.find(
                    (s) => String(s.pureId) === String(pureId)
                ) ?? null;
            }
            if (isPurchase || isPurchaseReturn) {
                return itemsStockList.find(
                    (s) =>
                        String(s.itemId) === String(pureId) ||
                        String(s.pureId) === String(pureId)
                ) ?? null;
            }
            return null;
        },
        [pureStockList, itemsStockList, isIssue, isReceipt, isPurchase, isPurchaseReturn]
    );

    return {
        transactionKeys,
        isIssue,
        isPurchase,
        isPurchaseReturn,
        isReceipt,
        getStockAvailability,
        getAvailableWeight,
        getAvailablePieces,
        validateQuantity,
        getStockForTransaction,
        // Expose edit calculator methods for direct access if needed
        ...(isEditMode && {
            getEditAvailableWeightForISP: (pureId: string) => editCalculator.getAvailableWeightForISP(pureId),
            getEditAvailableWeightForPU: (itemId: string) => editCalculator.getAvailableWeightForPU(itemId),
        }),
    };
}