// hooks/useEditStockCalculator.ts
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

    const getOriginalUsage = (id: string, field: string, type: 'IS' | 'SA'): number => {
        const details = originalTransactionData?.TRANSACTION_DETAILS;
        if (!details) return 0;

        const rows = type === 'IS'
            ? [...(details.issue || [])]
            : [...(details.sales || []), ...(details.sales_return || [])];

        return rows
            .filter(r => String(r.PUREID || r.ITEMID) === String(id))
            .reduce((sum, r) => sum + Number(r[field] || 0), 0);
    };

    const getDraftUsage = (id: string, field: string, type: 'IS' | 'SA'): number => {
        return draftRows
            .filter(r => {
                const matchId = String(r.PUREID || r.ITEMID) === String(id);
                const isSaleType = SALETRANSACTIONTYPES.includes(r.TRANSACTION_TYPE);
                const matchType = type === 'SA' ? isSaleType : !isSaleType;
                return matchId && matchType;
            })
            .reduce((sum, r) => sum + Number(r[field] || 0), 0);
    };

    const getEditStock = (id: string, baseStock: number, type: 'IS' | 'SA'): number => {
        const field = type === 'IS' ? 'WT' : 'NETWT';
        const original = getOriginalUsage(id, field, type);
        const draft = getDraftUsage(id, field, type);

        // Formula: Base Stock + Original (return to stock) - Draft (current usage)
        return baseStock + original - draft;
    };

    const getAvailableWeightForIS = (pureId: string): number => {
        const stock = pureStockList.find(s => String(s.pureId) === String(pureId));
        if (!stock) return 0;
        return getEditStock(pureId, Number(stock.weight || 0), 'IS');
    };

    const getAvailableWeightForSA = (itemId: string): number => {
        const stock = itemsStockList.find(s =>
            String(s.itemId) === String(itemId) || String(s.pureId) === String(itemId)
        );
        if (!stock) return 0;
        return getEditStock(itemId, Number(stock.netwt || 0), 'SA');
    };

    return {
        getAvailableWeightForIS,
        getAvailableWeightForSA,
        getEditStock,
        getOriginalUsage,
        getDraftUsage
    };
}