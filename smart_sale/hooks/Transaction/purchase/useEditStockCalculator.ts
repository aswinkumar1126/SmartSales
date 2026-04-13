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

    const getOriginalUsage = (id: string, field: string, type: 'ISP' | 'PU'): number => {
        const details = originalTransactionData?.TRANSACTION_DETAILS;
        if (!details) return 0;

        const rows = type === 'ISP'
            ? [...(details.issue || []), ...(details.receipt || [])]
            : [...(details.sales || []), ...(details.sales_return || [])];

        return rows
            .filter(r => String(r.PUREID || r.ITEMID) === String(id))
            .reduce((sum, r) => sum + Number(r[field] || 0), 0);
    };

    const getDraftUsage = (id: string, field: string, type: 'ISP' | 'PU'): number => {
        return draftRows
            .filter(r => {
                const matchId = String(r.PUREID || r.ITEMID) === String(id);
                const isPurchaseType = TRANSACTIONTYPES.includes(r.TRANSACTION_TYPE);
                const matchType = type === 'PU' ? isPurchaseType : !isPurchaseType;
                return matchId && matchType;
            })
            .reduce((sum, r) => sum + Number(r[field] || 0), 0);
    };

    const getEditStock = (id: string, baseStock: number, type: 'ISP' | 'PU'): number => {
        const field = type === 'ISP' ? 'WT' : 'NETWT';
        const original = getOriginalUsage(id, field, type);
        const draft = getDraftUsage(id, field, type);

        // Formula: Base Stock + Original (return to stock) - Draft (current usage)
        return baseStock + original - draft;
    };

    const getAvailableWeightForISP = (pureId: string): number => {
        const stock = pureStockList.find(s => String(s.pureId) === String(pureId));
        if (!stock) return 0;
        return getEditStock(pureId, Number(stock.weight || 0), 'ISP');
    };

    const getAvailableWeightForPU = (itemId: string): number => {
        const stock = itemsStockList.find(s =>
            String(s.itemId) === String(itemId) || String(s.pureId) === String(itemId)
        );
        if (!stock) return 0;
        return getEditStock(itemId, Number(stock.netwt || 0), 'PU');
    };

    return {
        getAvailableWeightForISP,
        getAvailableWeightForPU,
        getEditStock,
        getOriginalUsage,
        getDraftUsage
    };
}