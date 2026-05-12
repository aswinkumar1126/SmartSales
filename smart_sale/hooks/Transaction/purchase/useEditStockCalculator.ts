// hooks/useEditStockCalculator.ts
interface EditingStockProps {
    pureStockList: any[];
    itemsStockList: any[];
    draftRows: any[];
    originalTransactionData: any;
    TRANSACTIONTYPES: any[];
}

export function useEditStockCalculator({
    pureStockList,
    itemsStockList,
    draftRows,
    originalTransactionData,
    TRANSACTIONTYPES,
}: EditingStockProps) {

    // ✅ Added touch parameter to filter by both id AND touch
    const getOriginalUsage = (
        id: string,
        touch: number | null,
        field: string,
        type: 'ISP' | 'PU'
    ): number => {
        const details = originalTransactionData?.TRANSACTION_DETAILS;
        if (!details) return 0;

        const rows = type === 'ISP'
            ? [...(details.issue || [])]
            : [...(details.purchase || [])];

        return rows
            .filter(r => {
                const matchId = String(r.PUREID || r.ITEMID) === String(id);
                // ✅ Only filter by touch for ISP (pure stock), PU uses itemId
                const matchTouch = type === 'ISP' && touch != null
                    ? Number(r.TOUCH) === Number(touch)
                    : true;
                return matchId && matchTouch;
            })
            .reduce((sum, r) => sum + Number(r[field] || 0), 0);
    };

    // ✅ Added touch parameter
    const getDraftUsage = (
        id: string,
        touch: number | null,
        field: string,
        type: 'ISP' | 'PU'
    ): number => {
        return draftRows
            .filter(r => {
                const matchId = String(r.PUREID || r.ITEMID) === String(id);
                // ✅ Filter by touch for ISP rows
                const matchTouch = type === 'ISP' && touch != null
                    ? Number(r.TOUCH) === Number(touch)
                    : true;
                const isPurchaseType = TRANSACTIONTYPES.includes(r.TRANSACTION_TYPE);
                const matchType = type === 'PU' ? isPurchaseType : !isPurchaseType;
                return matchId && matchTouch && matchType;
            })
            .reduce((sum, r) => sum + Number(r[field] || 0), 0);
    };

    // ✅ Added touch parameter
    const getEditStock = (
        id: string,
        touch: number | null,
        baseStock: number,
        type: 'ISP' | 'PU'
    ): number => {
        const field = type === 'ISP' ? 'WT' : 'NETWT';
        const original = getOriginalUsage(id, touch, field, type);
        const draft = getDraftUsage(id, touch, field, type);

        // Formula: Base Stock + Original (return to stock) - Draft (current usage)
        return baseStock + original - draft;
    };

    // ✅ Added touch parameter — find stock by BOTH pureId AND touch
    const getAvailableWeightForISP = (pureId: string, touch: number | null): number => {
        const stock = pureStockList.find(
            s => String(s.pureId) === String(pureId) && Number(s.aTouch) === Number(touch)
        );
        if (!stock) return 0;
        return getEditStock(pureId, touch, Number(stock.aWt || 0), 'ISP');
    };

    // touch not needed for PU (items stock doesn't have touch)
    const getAvailableWeightForPU = (itemId: string): number => {
        const stock = itemsStockList.find(s =>
            String(s.itemId) === String(itemId) || String(s.pureId) === String(itemId)
        );
        if (!stock) return 0;
        return getEditStock(itemId, null, Number(stock.netwt || 0), 'PU');
    };

    return {
        getAvailableWeightForISP,
        getAvailableWeightForPU,
        getEditStock,
        getOriginalUsage,
        getDraftUsage
    };
}