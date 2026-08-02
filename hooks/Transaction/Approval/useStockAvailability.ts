// hooks/useStockAvailability.ts
import { useCallback, useMemo } from 'react';
import { ApprovalTransactionKey, APPROVAL_TRANSACTION_KEY_MAP } from "@/types/transcation/ApprovalTransaction";
import { useEditStockCalculator } from './useEditStockCalculator';

interface UseStockAvailabilityDeps {
    transactionCode: string[];
    pureStockList: any[];
    itemsStockList: any[];
    draftRows: any[];
    SALETRANSACTIONTYPES?: any[];
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
    transactionKeys: Set<ApprovalTransactionKey>;
    isApprovalIssue: boolean;
    isApprovalReceipt: boolean;
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
    itemsStockList,
    draftRows,

    isEditMode = false,
    originalTransactionData,
}: UseStockAvailabilityDeps) {

    // ─── Build existingUsage once from saved transaction ─────────────────────
    const existingUsage = useMemo(() => {
        if (!isEditMode || !originalTransactionData?.TRANSACTION_DETAILS) return undefined;

        const details = originalTransactionData.TRANSACTION_DETAILS;


        // Items stock — keyed by itemId
        const APPIS: Record<string, { netwt: number; pcs: number }> = {};
        ; (details.APPROVAL_ISSUE || []).forEach((r: any) => {
            const key = String(r.ITEMID);
            if (!APPIS[key]) APPIS[key] = { netwt: 0, pcs: 0 };
            APPIS[key].netwt += Number(r.NETWT || 0);
            APPIS[key].pcs += Number(r.PCS || 0);
        });

        const APPRE: Record<string, { netwt: number; pcs: number }> = {};
        ; (details.APPROVAL_RECEIPT || []).forEach((r: any) => {
            const key = String(r.ITEMID || r.PUREID);
            if (!APPRE[key]) APPRE[key] = { netwt: 0, pcs: 0 };
            APPRE[key].netwt += Number(r.NETWT || 0);
            APPRE[key].pcs += Number(r.PCS || 0);
        });

        console.log('existingUsage (sales):', { APPIS, APPRE });
        return { APPIS, APPRE };

    }, [isEditMode, originalTransactionData]);

    const editCalculator = useEditStockCalculator({

        itemsStockList,
        draftRows,
        existingUsage,
    });

    const transactionKeys = new Set(
        transactionCode.map(code => APPROVAL_TRANSACTION_KEY_MAP[code])
    );

    const isApprovalIssue = transactionKeys.has('APPROVAL_ISSUE');
    const isApprovalReceipt = transactionKeys.has('APPROVAL_RECEIPT');

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


            const itemStock = (isApprovalIssue || isApprovalReceipt)
                ? itemsStockList.find(
                    s => String(s.ITEMID ?? s.itemId) === String(id) ||
                        String(s.pureId ?? s.PUREID) === String(id)
                )
                : undefined;

            if (itemStock) {
                stock = itemStock;
                baseWeight = Number(stock.NETWT ?? stock.netwt ?? stock.netWeight ?? stock.purewt ?? 0);
                basePieces = Number(stock.PCS ?? stock.pcs ?? stock.pieces ?? stock.quantity ?? 0);
                stockSource = 'items';

            } else {
                console.warn('⚠️ No stock found for id:', id, 'touch:', touch);
                return undefined;
            }



            // ─── 3. Weight via calculator (existingRestore + draftImpact) ─────
            const weightAvailable = editCalculator.getEditStock(
                String(id),
                touch = null,
                baseWeight,

            );
            const usedWeight = baseWeight - weightAvailable;

            // ─── 4. Pieces via calculator (SA/SR only) ────────────────────────
            const piecesAvailable = editCalculator.getEditStockPcs(String(id), basePieces)

            const usedPieces = basePieces - piecesAvailable;

            // ─── 5. Resolve flags from actual resolved type ───────────────────
            const resolvedApprovalIsIssue = isApprovalIssue;
            const resolvedApprovalIsReceipt = isApprovalReceipt;

            return {
                stock,
                stockSource,
                transactionKeys,
                isApprovalIssue: resolvedApprovalIsIssue,
                isApprovalReceipt: resolvedApprovalIsReceipt,
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

            itemsStockList,
            isApprovalIssue,
            isApprovalReceipt,
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



            if (availability.isApprovalIssue || availability.isApprovalReceipt) {
                if (field === 'NETWT') return value <= availability.weight.remaining;
                if (field === 'PIECES') return value <= availability.pieces.remaining;
            }

            return false;
        },
        [getStockAvailability]
    );

    const getStockForTransaction = useCallback(
        (id: string | number, touch?: number | null) => {
            if (isApprovalIssue || isApprovalReceipt) {
                return itemsStockList.find(
                    s => String(s.itemId ?? s.ITEMID) === String(id)
                ) ?? null;
            }
            return null;
        },
        [itemsStockList, isApprovalIssue, isApprovalReceipt]
    );

    return {
        transactionKeys,

        isApprovalIssue,
        isApprovalReceipt,

        getStockAvailability,
        getAvailableWeight,
        getAvailablePieces,
        validateQuantity,
        getStockForTransaction,
        ...(isEditMode && {
            getEditAvailableWeightForAPPIS: (itemId: string) =>
                editCalculator.getAvailableWeightForAPPIS(itemId),
            getEditAvailablePcsForISP: (itemId: string) =>
                editCalculator.getAvailablePcsForAPPIS(itemId),
        }),
    };
}