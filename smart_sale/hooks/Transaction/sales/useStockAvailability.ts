// hooks/useStockAvailability.ts
import { useCallback, useMemo } from 'react';
import { SaleTransactionKey, SALE_TRANSACTION_KEY_MAP } from "@/types/transcation/SaleTransaction";
import { useEditStockCalculator } from './useEditStockCalculator';

interface UseStockAvailabilityDeps {
    transactionCode: string[];
    pureStockList: any[];
    itemsStockList: any[];
    draftRows: any[];
    SALETRANSACTIONTYPES: any[];
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

    // ─── Build existingUsage once from saved transaction ─────────────────────
    const existingUsage = useMemo(() => {
        if (!isEditMode || !originalTransactionData?.TRANSACTION_DETAILS) return undefined;

        const details = originalTransactionData.TRANSACTION_DETAILS;

        // Pure stock — keyed by `${pureId}_${touch}`
        const is: Record<string, { wt: number }> = {};
        ; (details.issue || []).forEach((r: any) => {
            const key = `${r.PUREID}_${r.TOUCH ?? ''}`;
            if (!is[key]) is[key] = { wt: 0 };
            is[key].wt += Number(r.WT || 0);
        });

        const re: Record<string, { wt: number }> = {};
        ; (details.receipt || []).forEach((r: any) => {
            const key = `${r.PUREID}_${r.TOUCH ?? ''}`;
            if (!re[key]) re[key] = { wt: 0 };
            re[key].wt += Number(r.WT || 0);
        });

        // Items stock — keyed by itemId
        const sa: Record<string, { netwt: number; pcs: number }> = {};
        ; (details.sales || []).forEach((r: any) => {
            const key = String(r.ITEMID || r.PUREID);
            if (!sa[key]) sa[key] = { netwt: 0, pcs: 0 };
            sa[key].netwt += Number(r.NETWT || 0);
            sa[key].pcs += Number(r.PCS || 0);
        });

        const sr: Record<string, { netwt: number; pcs: number }> = {};
        ; (details.sales_return || []).forEach((r: any) => {
            const key = String(r.ITEMID || r.PUREID);
            if (!sr[key]) sr[key] = { netwt: 0, pcs: 0 };
            sr[key].netwt += Number(r.NETWT || 0);
            sr[key].pcs += Number(r.PCS || 0);
        });

        console.log('existingUsage (sales):', { is, re, sa, sr });
        return { is, re, sa, sr };

    }, [isEditMode, originalTransactionData]);

    const editCalculator = useEditStockCalculator({
        pureStockList,
        itemsStockList,
        draftRows,
        originalTransactionData,
        SALETRANSACTIONTYPES,
        existingUsage,
    });

    const transactionKeys = new Set(
        transactionCode.map(code => SALE_TRANSACTION_KEY_MAP[code])
    );

    const isIssue = transactionKeys.has('issue');
    const isSales = transactionKeys.has('sales');
    const isSalesReturn = transactionKeys.has('sales_return');
    const isReceipt = transactionKeys.has('receipt');

    const getStockAvailability = useCallback(
        (
            id: string | number | null,
            touch: number | null,
            options?: StockAvailabilityOptions
        ): StockAvailability | undefined => {
            if (!id) return undefined;

            const { excludeRowId } = options ?? {};
            let stock: any = null;
            let baseWeight = 0;
            let basePieces = 0;
            let stockSource: 'pure' | 'items';

            // ─── 1. Find stock ────────────────────────────────────────────────
            const pureStock = (isIssue || isReceipt)
                ? pureStockList.find(
                    s => String(s.pureId) === String(id) &&
                        Number(s.aTouch) === Number(touch)
                )
                : undefined;

            const itemStock = (isSales || isSalesReturn)
                ? itemsStockList.find(
                    s => String(s.ITEMID ?? s.itemId) === String(id) ||
                        String(s.pureId ?? s.PUREID) === String(id)
                )
                : undefined;

            // touch present → pure stock, touch null → items stock
            if (touch != null && pureStock) {
                stock = pureStock;
                baseWeight = Number(stock.aWt ?? 0);
                stockSource = 'pure';

            } else if (itemStock) {
                stock = itemStock;
                baseWeight = Number(stock.NETWT ?? stock.netwt ?? stock.netWeight ?? stock.purewt ?? 0);
                basePieces = Number(stock.PCS ?? stock.pcs ?? stock.pieces ?? stock.quantity ?? 0);
                stockSource = 'items';

            } else if (pureStock) {
                // fallback: touch null but only pure stock found
                stock = pureStock;
                baseWeight = Number(stock.aWt ?? 0);
                stockSource = 'pure';

            } else {
                console.warn('⚠️ No stock found for id:', id, 'touch:', touch);
                return undefined;
            }

            // ─── 2. Determine type ────────────────────────────────────────────
            const type: 'IS' | 'SA' = stockSource === 'pure' ? 'IS' : 'SA';

            // ─── 3. Weight via calculator (existingRestore + draftImpact) ─────
            const weightAvailable = editCalculator.getEditStock(
                String(id),
                type === 'SA' ? null : touch,
                baseWeight,
                type
            );
            const usedWeight = baseWeight - weightAvailable;

            // ─── 4. Pieces via calculator (SA/SR only) ────────────────────────
            const piecesAvailable = type === 'SA'
                ? editCalculator.getEditStockPcs(String(id), basePieces)
                : 0;
            const usedPieces = basePieces - piecesAvailable;

            // ─── 5. Resolve flags from actual resolved type ───────────────────
            const resolvedIsIssue = type === 'IS' && isIssue;
            const resolvedIsReceipt = type === 'IS' && isReceipt;
            const resolvedIsSales = type === 'SA' && isSales;
            const resolvedIsSalesReturn = type === 'SA' && isSalesReturn;

            return {
                stock,
                stockSource,
                transactionKeys,
                isIssue: resolvedIsIssue,
                isSales: resolvedIsSales,
                isSalesReturn: resolvedIsSalesReturn,
                isReceipt: resolvedIsReceipt,
                weight: {
                    total: baseWeight,
                    used: Math.max(usedWeight, 0),
                    remaining: Math.max(weightAvailable, 0),
                },
                pieces: {
                    total: basePieces,
                    used: Math.max(usedPieces, 0),
                    remaining: Math.max(piecesAvailable, 0),
                },
                total: baseWeight,
                used: Math.max(usedWeight, 0),
                remaining: Math.max(weightAvailable, 0),
                usedPieces: Math.max(usedPieces, 0),
                remainingPieces: Math.max(piecesAvailable, 0),
            };
        },
        [
            pureStockList,
            itemsStockList,
            isIssue,
            isSales,
            isSalesReturn,
            isReceipt,
            transactionKeys,
            editCalculator,
        ]
    );

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
            id: string | number | null,
            touch: number | null,
            value: number,
            options: ValidateOptions
        ): boolean => {
            if (!id) return true;

            const availability = getStockAvailability(id, touch, {
                excludeRowId: options.excludeRowId,
                originalValue: options.originalValue,
            });
            if (!availability) return true;

            const { field } = options;

            if (availability.isIssue || availability.isReceipt) {
                if (field === 'WT') return value <= availability.weight.remaining;
                if (field === 'PIECES') return value <= availability.pieces.remaining;
            }

            if (availability.isSales || availability.isSalesReturn) {
                if (field === 'NETWT') return value <= availability.weight.remaining;
                if (field === 'PIECES') return value <= availability.pieces.remaining;
            }

            return false;
        },
        [getStockAvailability]
    );

    const getStockForTransaction = useCallback(
        (id: string | number, touch?: number | null) => {
            if (isIssue || isReceipt) {
                return pureStockList.find(
                    s => String(s.pureId) === String(id) &&
                        (touch != null ? Number(s.aTouch) === Number(touch) : true)
                ) ?? null;
            }
            if (isSales || isSalesReturn) {
                return itemsStockList.find(
                    s => String(s.itemId ?? s.ITEMID) === String(id) ||
                        String(s.pureId ?? s.PUREID) === String(id)
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
            getEditAvailablePcsForSA: (itemId: string) =>
                editCalculator.getAvailablePcsForSA(itemId),
        }),
    };
}