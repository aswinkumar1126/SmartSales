// hooks/useStockAvailability.ts

import { useCallback } from 'react';
import { SaleTransactionKey,  SALE_TRANSACTION_KEY_MAP,  SaleTransactionType } from "@/types/transcation/SaleTransaction";
// ─── Types ────────────────────────────────────────────────────────────────────

interface UseStockAvailabilityDeps {
    transactionCode: string;
    pureStockList: any[];
    itemsStockList: any[];
    draftRows: any[];                 // ✅ ADD THIS
    SALETRANSACTIONTYPES: any[];     // ✅ ADD THIS
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
}

export interface StockAvailability {
    stock: any;
    stockSource: 'pure' | 'items';
    transactionKey: SaleTransactionKey;
    isIssue: boolean;
    isSales: boolean;
    isSalesReturn: boolean;
    isReceipt: boolean;
    weight: QuantityDetail;
    pieces: QuantityDetail;
    // backward-compat
    total: number;
    used: number;
    remaining: number;
    usedPieces: number;
    remainingPieces: number;
}

export interface ValidateOptions {
    field: 'WT' | 'PIECES' | 'NETWT';
    excludeRowId?: string;
    originalValue?: number;
}

// ─── Hook deps ────────────────────────────────────────────────────────────────



// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStockAvailability({
    transactionCode,
    pureStockList,
    itemsStockList,
    draftRows,
    SALETRANSACTIONTYPES
}: UseStockAvailabilityDeps) {

  
    // Derive key + booleans once from the prop — no raw string checks anywhere below
    const transactionKey = SALE_TRANSACTION_KEY_MAP[transactionCode];
    const isIssue = transactionKey === 'issue';
    const isSales = transactionKey === 'sales';
    const isSalesReturn = transactionKey === 'sales_return';
    const isReceipt = transactionKey === 'receipt';

    // ── Core ──────────────────────────────────────────────────────────────────


    const getUsedQuantityByPureId = useCallback((pureId: string | number, options?: {
        excludeRowId?: string,
        transactionTypeCode?: string,
        field?: 'WT' | 'PCS' | 'NETWT'
    }) => {
        const pureIdStr = String(pureId);
        const { excludeRowId, transactionTypeCode, field = 'WT' } = options || {};

        const filteredRows = draftRows.filter(row => {
            // Skip editing row
            if (excludeRowId && row.__rowId === excludeRowId) return false;

            // Match PUREID / ITEMID
            if (String(row.PUREID || row.ITEMID) !== pureIdStr) return false;

            // Match transaction type
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

    }, [draftRows, SALETRANSACTIONTYPES]);

    const getStockAvailability = useCallback(
        (
            pureId: string | number | null,
            options?: StockAvailabilityOptions
        ): StockAvailability | undefined => {
            if (!pureId) return undefined;

            console.log(pureId,'pureIdpureId')

            const { excludeRowId, originalValue } = options ?? {};

            let stock: any = null;
            let totalAvailableWeight = 0;
            let totalAvailablePieces = 0;
            let stockSource: 'pure' | 'items';
            console.log(pureStockList,isIssue,isReceipt,isSales,isSalesReturn,'pureStockList')

            if (isIssue || isReceipt) {
                stock = pureStockList.find(
                    (s) => String(s.pureId) === String(pureId)
                );

                console.log(stock,'stockinpure')
                if (!stock) return undefined;
                totalAvailableWeight = Number(stock.weight ?? 0);
                stockSource = 'pure';

            } else if (isSales || isSalesReturn) {
                stock = itemsStockList.find(
                    (s) =>
                        String(s.itemId) === String(pureId) ||
                        String(s.pureId) === String(pureId)
                );
                if (!stock) return undefined;
                totalAvailablePieces = Number(stock.pcs ?? stock.pieces ?? stock.quantity ?? 0);
                totalAvailableWeight = Number(stock.netwt ?? stock.netWeight ?? stock.purewt ?? 0);
                stockSource = 'items';

            } else {
                return undefined;
            }

            // DB-level codes for getUsedQuantityByPureId
            const dbCode = isIssue || isReceipt ? 'IS' : 'SA';

            const usedWeight = getUsedQuantityByPureId(pureId, {
                excludeRowId,
                transactionTypeCode: dbCode,
                field: isIssue || isReceipt ? 'WT' : 'NETWT',
            });

            const usedPieces = getUsedQuantityByPureId(pureId, {
                excludeRowId,
                transactionTypeCode: dbCode,
                field: 'PCS',
            });

            const weightRemaining = Math.max(totalAvailableWeight - usedWeight, 0);
            const piecesRemaining = Math.max(totalAvailablePieces - usedPieces, 0);

            return {
                stock,
                stockSource,
                transactionKey,
                isIssue,
                isSales,
                isSalesReturn,
                isReceipt,
                weight: { total: totalAvailableWeight, used: usedWeight, remaining: weightRemaining },
                pieces: { total: totalAvailablePieces, used: usedPieces, remaining: piecesRemaining },
                // backward compat
                total: totalAvailableWeight,
                used: usedWeight,
                remaining: weightRemaining,
                usedPieces,
                remainingPieces: piecesRemaining,
            };
        },
        [
            pureStockList,
            itemsStockList,
            getUsedQuantityByPureId,
            isIssue,
            isSales,
            isSalesReturn,
            isReceipt,
            transactionKey,
        ]
    );

    // ── Convenience helpers ───────────────────────────────────────────────────

    const getAvailableWeight = useCallback(
        (pureId: string | number | null, options?: StockAvailabilityOptions) =>
            getStockAvailability(pureId, options)?.weight.remaining ?? null,
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
    };
}