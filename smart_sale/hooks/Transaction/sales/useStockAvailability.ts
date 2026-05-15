// hooks/useStockAvailability.ts (UPDATED)
import { useCallback, useMemo } from 'react';
import { SaleTransactionKey, SALE_TRANSACTION_KEY_MAP } from "@/types/transcation/SaleTransaction";
import { useEditStockCalculator } from './useEditStockCalculator';

interface UseStockAvailabilityDeps {
    transactionCode: string[];
    pureStockList: any[];
    itemsStockList: any[];
    draftRows: any[];
    SALETRANSACTIONTYPES: any[];
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
  transactionKeys: Set<SaleTransactionKey>;
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
    SALETRANSACTIONTYPES,
    isEditMode = false,
    originalTransactionData,
}: UseStockAvailabilityDeps) {

    const editCalculator = useEditStockCalculator({
        pureStockList,
        itemsStockList,
        draftRows,
        originalTransactionData,
        SALETRANSACTIONTYPES,
    });

    const transactionKeys = new Set(
        transactionCode.map(code => SALE_TRANSACTION_KEY_MAP[code])
    );

    const isIssue = transactionKeys.has('issue');
    const isSales = transactionKeys.has('sales');
    const isSalesReturn = transactionKeys.has('sales_return');
    const isReceipt = transactionKeys.has('receipt');

    // ✅ Added touch as explicit 2nd param
    const getUsedQuantityById = useCallback((
        id: string | number,
        touch: number | null,
        options?: {
            excludeRowId?: string,
            transactionTypeCode?: string,
            field?: 'WT' | 'PCS' | 'NETWT'
        }
    ) => {
        const pureIdStr = String(id);
        const { excludeRowId, transactionTypeCode, field = 'WT' } = options || {};

        const filteredRows = draftRows.filter(row => {
            if (excludeRowId && row.__rowId === excludeRowId) return false;
            if (String(row.PUREID || row.ITEMID) !== pureIdStr) return false;

            // ✅ Filter by touch for IS rows only
            if (touch != null && (isIssue || isReceipt)) {
                const rowTouch = Number(row.ATOUCH ?? row.ATOUCH ?? row.touch);
                if (rowTouch !== Number(touch)) return false;
            }

            const transactionType = SALETRANSACTIONTYPES.find(
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
    }, [draftRows, SALETRANSACTIONTYPES, isIssue, isReceipt]);

    const getStockAvailability = useCallback(
        (
            id: string | number | null,
            touch: number|null ,
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
                // ✅ Find by pureId + touch
                stock = pureStockList.find(
                    (s) => String(s.pureId) === String(id) && Number(s.aTouch) === Number(touch)
                );
                if (!stock) return undefined;

                if (isEditMode && originalTransactionData) {
                    // ✅ Pass touch to getOriginalUsage
                    originalUsage = editCalculator.getOriginalUsage(String(id), touch, 'WT', 'IS');
                }

                totalAvailableWeight = Number(stock.aWt ?? 0) + Number(originalUsage);
                stockSource = 'pure';

            } else if (isSales || isSalesReturn) {
                stock = itemsStockList.find(
                    (s) =>
                        String(s.ITEMID) === String(id) ||
                        String(s.pureId) === String(id)
                );

                console.log(stock, 'stockstockstock');

                if (!stock) return undefined;

                if (isEditMode && originalTransactionData) {
                    // touch not needed for SA
                    originalUsage = editCalculator.getOriginalUsage(String(id), null, 'NETWT', 'SA');
                }

                totalAvailablePieces = Number(stock.PCS ?? stock.pieces ?? stock.quantity ?? 0);
                totalAvailableWeight = Number(stock.NETWT ?? stock.netWeight ?? stock.purewt ?? 0) + Number(originalUsage);
                stockSource = 'items';

            } else {
                return undefined;
            }

            const dbCode = isIssue || isReceipt ? 'IS' : 'SA';

            // ✅ Pass touch to both used quantity calls
            const usedWeight = getUsedQuantityById(id, touch, {
                excludeRowId,
                transactionTypeCode: dbCode,
                field: isIssue || isReceipt ? 'WT' : 'NETWT',
            });

            const usedPieces = getUsedQuantityById(id, touch, {
                excludeRowId,
                transactionTypeCode: dbCode,
                field: 'PCS',
            });

            let weightRemaining: number;
            let piecesRemaining: number;

            if (isEditMode) {
                weightRemaining = Math.max(totalAvailableWeight - usedWeight, 0);
                piecesRemaining = Math.max(totalAvailablePieces + (isSales || isSalesReturn ? originalUsage : 0) - usedPieces, 0);
            } else {
                weightRemaining = Math.max(totalAvailableWeight - usedWeight, 0);
                piecesRemaining = Math.max(totalAvailablePieces - usedPieces, 0);
            }

            return {
                stock,
                stockSource,
                transactionKeys,
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
            transactionKeys,
            isEditMode,
            originalTransactionData,
            editCalculator,
        ]
    );

    // ✅ Update wrappers to pass touch
    const getAvailableWeight = useCallback(
        (id: string | number | null, touch: number | null, options?: StockAvailabilityOptions) =>
            getStockAvailability(id, touch, options)?.weight.remaining ?? null,
        [getStockAvailability]
    );

    const getAvailablePieces = useCallback(
        (id: string | number | null, touch: number | null, options?: StockAvailabilityOptions) =>
            getStockAvailability(id, touch, options)?.pieces.remaining ?? null,
        [getStockAvailability]
    );

    const validateQuantity = useCallback(
        (
            pureId: string | number | null,
            touch: number | null,       // ✅ Added touch
            value: number,
            options: ValidateOptions
        ): boolean => {
            if (!pureId) return true;

            const availability = getStockAvailability(pureId, touch, {
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
        (pureId: string | number, touch?: number | null) => {
            if (isIssue || isReceipt) {
                return pureStockList.find(
                    // ✅ Match by touch too if provided
                    (s) => String(s.pureId) === String(pureId) &&
                        (touch != null ? Number(s.aTouch) === Number(touch) : true)
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
        transactionKeys,
        isIssue,
        isSales,
        isSalesReturn,
        isReceipt,
        getStockAvailability,
        getAvailableWeight,
        getAvailablePieces,
        validateQuantity,
        getStockForTransaction,
        ...(isEditMode && {
            getEditAvailableWeightForIS: (pureId: string, touch: number | null) =>
                editCalculator.getAvailableWeightForIS(pureId, touch),
            getEditAvailableWeightForSA: (itemId: string) =>
                editCalculator.getAvailableWeightForSA(itemId),
        }),
    };
}