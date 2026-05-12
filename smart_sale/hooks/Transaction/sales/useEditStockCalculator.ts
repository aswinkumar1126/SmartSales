interface EditingStockProps {
    pureStockList: any[];
    itemsStockList: any[];
    draftRows: any[];
    originalTransactionData: any;
    SALETRANSACTIONTYPES: any[];
}

export function useEditStockCalculator({
    pureStockList,
    itemsStockList,
    draftRows,
    originalTransactionData,
    SALETRANSACTIONTYPES,
}: EditingStockProps) {

    // ✅ Added touch param — filter original rows by both id AND touch
    const getOriginalUsage = (id: string, touch: number | null, field: string, type: 'IS' | 'SA'): number => {
        const details = originalTransactionData?.TRANSACTION_DETAILS;
        if (!details) return 0;

        const rows = type === 'IS'
            ? [...(details.issue || [])]
            : [...(details.sales || []), ...(details.sales_return || [])];

        return rows
            .filter(r => {
                const matchId = String(r.PUREID || r.ITEMID) === String(id);
                // ✅ Only filter by touch for IS (pure stock)
                const matchTouch = type === 'IS' && touch != null
                    ? Number(r.TOUCH) === Number(touch)
                    : true;
                return matchId && matchTouch;
            })
            .reduce((sum, r) => sum + Number(r[field] || 0), 0);
    };

    // ✅ Added touch param
    const getDraftUsage = (id: string, touch: number | null, field: string, type: 'IS' | 'SA'): number => {
        return draftRows
            .filter(r => {
                const matchId = String(r.PUREID || r.ITEMID) === String(id);
                const matchTouch = type === 'IS' && touch != null
                    ? Number(r.TOUCH ?? r.ATOUCH) === Number(touch)
                    : true;
                const isSaleType = SALETRANSACTIONTYPES.includes(r.TRANSACTION_TYPE);
                const matchType = type === 'SA' ? isSaleType : !isSaleType;
                return matchId && matchTouch && matchType;
            })
            .reduce((sum, r) => sum + Number(r[field] || 0), 0);
    };

    // ✅ Added touch param
    const getEditStock = (id: string, touch: number | null, baseStock: number, type: 'IS' | 'SA'): number => {
        const field = type === 'IS' ? 'WT' : 'NETWT';
        const original = getOriginalUsage(id, touch, field, type);
        const draft = getDraftUsage(id, touch, field, type);
        return baseStock + original - draft;
    };

    // ✅ Find stock by pureId + touch
    const getAvailableWeightForIS = (pureId: string, touch: number | null): number => {
        const stock = pureStockList.find(
            s => String(s.pureId) === String(pureId) && Number(s.aTouch) === Number(touch)
        );
        if (!stock) return 0;
        return getEditStock(pureId, touch, Number(stock.aWt || 0), 'IS');
    };

    // touch not needed for SA (items stock)
    const getAvailableWeightForSA = (itemId: string): number => {
        const stock = itemsStockList.find(s =>
            String(s.itemId) === String(itemId) || String(s.pureId) === String(itemId)
        );
        if (!stock) return 0;
        return getEditStock(itemId, null, Number(stock.netwt || 0), 'SA');
    };

    return {
        getAvailableWeightForIS,
        getAvailableWeightForSA,
        getEditStock,
        getOriginalUsage,
        getDraftUsage
    };
}