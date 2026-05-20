// hooks/useStockAvailability.ts
import { useCallback } from 'react';
import { TransactionKey, TRANSACTION_KEY_MAP } from "@/types/transcation/Transaction";
import { useEditStockCalculator } from './useEditStockCalculator';

interface UseStockAvailabilityDeps {
    transactionCodes: string[];
    pureStockList: any[];
    itemsStockList: any[];
    draftRows: any[];
    TRANSACTIONTYPES: any[];
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

    // ─── Pieces: still a simple sum (pieces don't have isExisting sign logic yet) ───
    const getUsedPiecesById = useCallback((
        id: string | number | null,
        touch: number | null,
        excludeRowId?: string
    ): number => {
        const idStr = String(id);
        const isISP = isIssue || isReceipt;

        return draftRows
            .filter(row => {
                if (excludeRowId && row.__rowId === excludeRowId) return false;
                if (String(row.PUREID || row.ITEMID) !== idStr) return false;
                if (isISP && touch != null && Number(row.ATOUCH ?? row.TOUCH) !== Number(touch)) return false;
                return true;
            })
            .reduce((sum, row) => sum + (Number(row.PCS) || 0), 0);
    }, [draftRows, isIssue, isReceipt]);

    const getStockAvailability = useCallback(
        (
            id: string | number | null,
            touch: number | null,
            options?: StockAvailabilityOptions
        ): StockAvailability | undefined => {
            if (!id ) return undefined;

            console.log(id ,options ,'checkinginstcok')

            const { excludeRowId } = options ?? {};
            
            // console.log(pureStockList, itemsStockList, 'stock list in available')

            let stock: any = null;
            let baseWeight = 0;
            let basePieces = 0;
            let stockSource: 'pure' | 'items';

            console.log(stock, baseWeight,pureStockList, itemsStockList, 'stock in test')

            // ─── 1. Find base stock ───────────────────────────────────────────
            if (isIssue || isReceipt) {
                // IS / RE → pure stock, match by pureId + touch
                stock = pureStockList.find(
                    s => String(s.pureId) === String(id) && Number(s.aTouch) === Number(touch)
                );
                if (!stock) return undefined;

                baseWeight = Number(stock.aWt ?? 0);
                stockSource = 'pure';

            } else if (isPurchase || isPurchaseReturn) {
                // SA / SR → items stock, match by itemId or pureId
                stock = itemsStockList.find(
                    s => String(s.itemId) === String(id) || String(s.pureId) === String(id)
                );
                if (!stock) return undefined;

                baseWeight = Number(stock.netwt ?? stock.netWeight ?? stock.purewt ?? 0);
                basePieces = Number(stock.pcs ?? stock.pieces ?? stock.quantity ?? 0);
                stockSource = 'items';

            } else {
                return undefined;
            }

            // ─── 2. Available weight via calculator ───────────────────────────
            // editCalculator.getEditStock handles:
            //   • isExisting=true  → sign flipped (SA adds, SR reduces, IS adds, RE reduces)
            //   • isExisting=false → normal (SA reduces, SR adds, IS reduces, RE adds)
            // Works the same in both edit mode and normal mode.
            const type = (isIssue || isReceipt) ? 'ISP' : 'PU';
            const weightAvailable = editCalculator.getEditStock(
                String(id),
                touch,
                baseWeight,
                type
            );

            console.log(baseWeight,weightAvailable, 'weightAvailable');

            // ─── 3. Used weight = base - available (for display purposes) ─────
            const usedWeight = baseWeight - weightAvailable;

            // ─── 4. Pieces (simple sum, excludeRowId respected) ──────────────
            const usedPieces = getUsedPiecesById(id, touch, excludeRowId);
            const piecesRemaining = Math.max(basePieces - usedPieces, 0);

            return {
                stock,
                stockSource,
                transactionKeys,
                isIssue,
                isPurchase,
                isPurchaseReturn,
                isReceipt,
                weight: {
                    total: baseWeight,
                    used: Math.max(usedWeight, 0),
                    remaining: Math.max(weightAvailable, 0),
                },
                pieces: {
                    total: basePieces,
                    used: usedPieces,
                    remaining: piecesRemaining,
                },
                total: baseWeight,
                used: Math.max(usedWeight, 0),
                remaining: Math.max(weightAvailable, 0),
                usedPieces,
                remainingPieces: piecesRemaining,
            };
        },
        [
            pureStockList,
            itemsStockList,
            getUsedPiecesById,
            isIssue,
            isPurchase,
            isPurchaseReturn,
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
            value: number,
            touch: number | null,
            options: ValidateOptions
        ): boolean => {
            if (!id) return true;

            const availability = getStockAvailability(id, touch, {
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
        (id: string | number) => {
            if (isIssue || isReceipt) {
                return pureStockList.find(s => String(s.pureId) === String(id)) ?? null;
            }
            if (isPurchase || isPurchaseReturn) {
                return itemsStockList.find(
                    s => String(s.itemId) === String(id) || String(s.pureId) === String(id)
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
        ...(isEditMode && {
            getEditAvailableWeightForISP: (pureId: string, touch: number | null) =>
                editCalculator.getAvailableWeightForISP(pureId, touch),
            getEditAvailableWeightForPU: (itemId: string) =>
                editCalculator.getAvailableWeightForPU(itemId),
        }),
    };
}