// hooks/useStockAvailability.ts
import { useCallback, useMemo } from 'react';
import { SaleTransactionKey, SALE_TRANSACTION_KEY_MAP } from "@/types/transcation/SaleTransaction";
import { useEditStockCalculator } from './useEditStockCalculator';
import { formatToFixed } from '@/utils/format/numberFormat';

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

    // -----------------------------
    // EXISTING TRANSACTION RESTORE
    // -----------------------------
    const existingUsage = useMemo(() => {
        if (!isEditMode || !originalTransactionData?.TRANSACTION_DETAILS) return undefined;

        const d = originalTransactionData.TRANSACTION_DETAILS;

        const is: Record<string, { wt: number }> = {};
        const re: Record<string, { wt: number }> = {};
        const sa: Record<string, { netwt: number; pcs: number }> = {};
        const sr: Record<string, { netwt: number; pcs: number }> = {};

        // IS → reduce pure stock
        (d.issue || []).forEach((r: any) => {
            const key = `${r.PUREID}_${r.TOUCH ?? ''}`;
            is[key] = { wt: (is[key]?.wt || 0) + Number(r.WT || 0) };
        });

        // RE → add pure stock
        (d.receipt || []).forEach((r: any) => {
            const key = `${r.PUREID}_${r.TOUCH ?? ''}`;
            re[key] = { wt: (re[key]?.wt || 0) + Number(r.WT || 0) };
        });

        // SA → reduce item stock
        (d.sales || []).forEach((r: any) => {
            const key = String(r.ITEMID || r.PUREID);
            sa[key] = {
                netwt: (sa[key]?.netwt || 0) + Number(r.NETWT || 0),
                pcs: (sa[key]?.pcs || 0) + Number(r.PCS || 0),
            };
        });

        // SR → add item stock
        (d.sales_return || []).forEach((r: any) => {
            const key = String(r.ITEMID || r.PUREID);
            sr[key] = {
                netwt: (sr[key]?.netwt || 0) + Number(r.NETWT || 0),
                pcs: (sr[key]?.pcs || 0) + Number(r.PCS || 0),
            };
        });

        return { is, re, sa, sr };
    }, [isEditMode, originalTransactionData]);

    // -----------------------------
    // EDIT CALCULATOR
    // -----------------------------
    const editCalculator = useEditStockCalculator({
        pureStockList,
        itemsStockList,
        draftRows,
    });

    // -----------------------------
    // TRANSACTION FLAGS
    // -----------------------------
    const transactionKeys = new Set(
        transactionCode.map(code => SALE_TRANSACTION_KEY_MAP[code])
    );

    const isIssue = transactionKeys.has('issue');
    const isReceipt = transactionKeys.has('receipt');
    const isSales = transactionKeys.has('sales');
    const isSalesReturn = transactionKeys.has('sales_return');

    // -----------------------------
    // STOCK RESOLVER
    // -----------------------------
    const getStockAvailability = useCallback(
        (id: string | number | null, touch: number | null) => {
            if (!id) return undefined;

            let stock: any;
            let baseWeight = 0;
            let basePieces = 0;
            let source: 'pure' | 'items';

            // PURE STOCK (IS / RE)
            const pureStock = (isIssue || isReceipt)
                ? pureStockList.find(
                    s =>
                        String(s.pureId) === String(id) &&
                        Number(s.aTouch) === Number(touch)
                )
                : undefined;

            // ITEM STOCK (SA / SR)
            const itemStock = (isSales || isSalesReturn)
                ? itemsStockList.find(
                    s =>
                        String(s.itemId ?? s.ITEMID) === String(id) ||
                        String(s.pureId ?? s.PUREID) === String(id)
                )
                : undefined;

            if (pureStock) {
                stock = pureStock;
                baseWeight = Number(stock.aWt || 0);
                source = 'pure';
            } else if (itemStock) {
                stock = itemStock;
                baseWeight = Number(stock.NETWT || stock.netwt || 0);
                basePieces = Number(stock.PCS || stock.pcs || 0);
                source = 'items';
            } else {
                return undefined;
            }

            const type: 'PURE' | 'ITEM' = source === 'pure' ? 'PURE' : 'ITEM';

            const remainingWeight = editCalculator.getEditStock(
                String(id),
                type === 'PURE' ? touch : null,
                baseWeight,
                type === "PURE" ? "IS" : "SA"
            );

            const remainingPieces =
                type === 'ITEM'
                    ? editCalculator.getEditStockPcs(String(id), basePieces)
                    : 0;

            return {
                stock,
                stockSource: source,

                isIssue,
                isReceipt,
                isSales,
                isSalesReturn,

                weight: {
                    total: Number(formatToFixed(baseWeight,3)),
                    used: Number(formatToFixed((baseWeight - remainingWeight),3)),
                    remaining: Number(formatToFixed(remainingWeight,3)),
                },

                pieces: {
                    total: basePieces,
                    used: basePieces - remainingPieces,
                    remaining: remainingPieces,
                },

                total: Number(formatToFixed(baseWeight,3)),
                used: Number(formatToFixed((baseWeight - remainingWeight),3)),
                remaining: Number(formatToFixed(remainingWeight,3)),
            };
        },
        [
            pureStockList,
            itemsStockList,
            isIssue,
            isReceipt,
            isSales,
            isSalesReturn,
            editCalculator,
        ]
    );

    // -----------------------------
    // HELPERS
    // -----------------------------
    const getAvailableWeight = useCallback(
        (id: any, touch: any) =>
            getStockAvailability(id, touch)?.weight.remaining ?? null,
        [getStockAvailability]
    );

    const getAvailablePieces = useCallback(
        (id: any, touch: any) =>
            getStockAvailability(id, touch)?.pieces.remaining ?? null,
        [getStockAvailability]
    );

    const validateQuantity = useCallback(
        (id: any, touch: any, value: number, options: ValidateOptions) => {
            const availability = getStockAvailability(id, touch);
            if (!availability) return true;

            if (availability.isIssue || availability.isReceipt) {
                if (options.field === 'WT')
                    return value <= availability.weight.remaining;
            }

            if (availability.isSales || availability.isSalesReturn) {
                if (options.field === 'NETWT')
                    return value <= availability.weight.remaining;

                if (options.field === 'PIECES')
                    return value <= availability.pieces.remaining;
            }

            return false;
        },
        [getStockAvailability]
    );

    // -----------------------------
    // RETURN
    // -----------------------------
    return {
        transactionKeys,

        isIssue,
        isReceipt,
        isSales,
        isSalesReturn,

        getStockAvailability,
        getAvailableWeight,
        getAvailablePieces,
        validateQuantity,

        ...(isEditMode && {
            getEditAvailableWeightForIS: (id: string, touch: number | null) =>
                editCalculator.getEditStock(id, touch, 0, "IS"),

            getEditAvailableWeightForSA: (id: string) =>
                editCalculator.getEditStock(id, null, 0, "SA"),

            getEditAvailablePcsForSA: (id: string) =>
                editCalculator.getEditStockPcs(id, 0),
        }),
    };
}