// hooks/useStockAvailability.ts
import { useCallback ,useMemo} from 'react';
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

    // ✅ Build existingUsage from originalTransactionData once
    // ✅ Build existingUsage from originalTransactionData once
    const existingUsage = useMemo(() => {
        if (!isEditMode || !originalTransactionData?.TRANSACTION_DETAILS) return undefined;

        const details = originalTransactionData.TRANSACTION_DETAILS;

        // ─── Pure stock ───────────────────────────────────────────────
        const isp: Record<string, { wt: number }> = {};
        ; (details.issue || []).forEach((r: any) => {
            const key = `${r.PUREID}_${r.TOUCH ?? ''}`;
            if (!isp[key]) isp[key] = { wt: 0 };
            isp[key].wt += Number(r.WT || 0);
        });

        const rec: Record<string, { wt: number }> = {};
        ; (details.receipt || []).forEach((r: any) => {
            const key = `${r.PUREID}_${r.TOUCH ?? ''}`;
            if (!rec[key]) rec[key] = { wt: 0 };
            rec[key].wt += Number(r.WT || 0);
        });

        // ─── Items stock ──────────────────────────────────────────────
        const pu: Record<string, { netwt: number; pcs: number }> = {};
        ; (details.purchase || []).forEach((r: any) => {
            const key = String(r.ITEMID || r.PUREID);
            if (!pu[key]) pu[key] = { netwt: 0, pcs: 0 };
            pu[key].netwt += Number(r.NETWT || 0);
            pu[key].pcs += Number(r.PCS || 0);
        });

        const pr: Record<string, { netwt: number; pcs: number }> = {};
        ; (details.purchase_return || []).forEach((r: any) => {
            const key = String(r.ITEMID || r.PUREID);
            if (!pr[key]) pr[key] = { netwt: 0, pcs: 0 };
            pr[key].netwt += Number(r.NETWT || 0);
            pr[key].pcs += Number(r.PCS || 0);
        });

        console.log('existingUsage:', { isp, rec, pu, pr });
        return { isp, rec, pu, pr };

    }, [isEditMode, originalTransactionData]);
    console.log(existingUsage,'existingUsage')

    const editCalculator = useEditStockCalculator({
        pureStockList,
        itemsStockList,
        draftRows,
        originalTransactionData,
        TRANSACTIONTYPES,
        existingUsage, // ✅ pass it in
    });

    

    const transactionKeys = new Set(
        transactionCodes.map(code => TRANSACTION_KEY_MAP[code])
    );

    const isIssue = transactionKeys.has('issue');
    const isReceipt = transactionKeys.has('receipt');
    const isPurchase = transactionKeys.has('purchase');
    const isPurchaseReturn = transactionKeys.has('purchase_return');

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

            // ─── 1. Find stock by searching both lists ────────────────────────
            const pureStock = (isIssue || isReceipt)
                ? pureStockList.find(
                    s => String(s.pureId) === String(id) &&
                        Number(s.aTouch) === Number(touch)
                )
                : undefined;

            const itemStock = (isPurchase || isPurchaseReturn)
                ? itemsStockList.find(
                    s => String(s.itemId ?? s.ITEMID) === String(id) ||
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
                stock = pureStock;
                baseWeight = Number(stock.aWt ?? 0);
                stockSource = 'pure';

            } else {
                console.warn('⚠️ No stock found for id:', id, 'touch:', touch);
                return undefined;
            }

            const type: 'ISP' | 'PU' = stockSource === 'pure' ? 'ISP' : 'PU';

            // ─── 2. Weight via calculator (sign-aware) ────────────────────────
            const weightAvailable = editCalculator.getEditStock(
                String(id),
                type === 'PU' ? null : touch,
                baseWeight,
                type
            );
            const usedWeight = baseWeight - weightAvailable;

            // ─── 3. Pieces via calculator (sign-aware) ────────────────────────
            // ✅ Pure stock has no pieces — only calculate for items stock (PU/PR)
            const piecesAvailable = type === 'PU'
                ? editCalculator.getEditStockPcs(String(id), basePieces)
                : 0;
            const usedPieces = basePieces - piecesAvailable;

            // ─── 4. Resolve flags from actual resolved type ───────────────────
            const resolvedIsIssue = type === 'ISP' && isIssue;
            const resolvedIsReceipt = type === 'ISP' && isReceipt;
            const resolvedIsPurchase = type === 'PU' && isPurchase;
            const resolvedIsPurchaseReturn = type === 'PU' && isPurchaseReturn;

            return {
                stock,
                stockSource,
                transactionKeys,
                isIssue: resolvedIsIssue,
                isPurchase: resolvedIsPurchase,
                isPurchaseReturn: resolvedIsPurchaseReturn,
                isReceipt: resolvedIsReceipt,
                weight: {
                    total: baseWeight,
                    used: Math.max(usedWeight, 0),
                    remaining: Math.max(weightAvailable, 0),
                },
                // ✅ pieces now uses same sign logic as weight
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

            if (availability.isIssue || availability.isReceipt) {
                if (field === 'WT') return value <= availability.weight.remaining;
                if (field === 'PIECES') return value <= availability.pieces.remaining;
            }

            if (availability.isPurchase || availability.isPurchaseReturn) {
                if (field === 'NETWT') return value <= availability.weight.remaining;
                if (field === 'PIECES') return value <= availability.pieces.remaining;
            }

            return false;
        },
        [getStockAvailability]  // ✅ no longer needs individual flags
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
            getEditAvailablePcsForPU: (itemId: string) =>
                editCalculator.getAvailablePcsForPU(itemId),
        }),
    };
}