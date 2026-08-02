// hooks/useEditStockCalculator.ts

interface EditingStockProps {
    itemsStockList: any[];
    draftRows: any[];
    existingUsage?: {
        APPIS: Record<string, { netwt: number; pcs: number }>;
        APPRE: Record<string, { netwt: number; pcs: number }>;
    };
}




// These REDUCE available stock (new draft row = takes from stock)
const REDUCES_STOCK_CODES = ['IS', 'SA'];
// These ADD to available stock (new draft row = returns to stock)
const ADDS_STOCK_CODES = ['IR', 'SR'];

export function useEditStockCalculator({

    itemsStockList,
    draftRows,
    existingUsage,
}: EditingStockProps) {

    // const getStockTypeForCode = (code: string): 'IS' | 'SA' => {
    //     return PURE_STOCK_CODES.includes(code) ? 'IS' : 'SA';
    // };

    /**
     * Sign for draft rows:
     * IS / SA → -1 (reduce stock)
     * IR / SR → +1 (add to stock)
     */
    const getSignForRow = (code: string): 1 | -1 => {
        return ADDS_STOCK_CODES.includes(code) ? 1 : -1;
    };

    const filterDraftRows = (
        id: string,
    ) => {
        return draftRows.filter(r => {
            const matchId = String(r.ITEMID) === String(id);
            return matchId ;
        });
    };

    const getDraftNetImpact = (
        id: string,
        touch: number | null,
        field: string,
    ): number => {
        return filterDraftRows(id)
            .reduce((sum, r) => {
                const qty = Number(r[field] || 0);
                const sign = getSignForRow(r.TRANSACTION_TYPE);
                return sum + sign * qty;
            }, 0);
    };

    const getDraftNetImpactPcs = (id: string): number => {
        return filterDraftRows(id)
            .reduce((sum, r) => {
                const qty = Number(r.PCS || 0);
                const sign = getSignForRow(r.TRANSACTION_TYPE);
                return sum + sign * qty;
            }, 0);
    };

    /**
     * Available weight:
     * = baseStock
     *   + existingIS   (issue was reducing → restore +wt)
     *   - existingIR   (receipt was adding → restore -wt)
     *   + existingSA   (sales was reducing → restore +netwt)
     *   - existingSR   (sales return was adding → restore -netwt)
     *   + draftImpact  (draft rows carry their own sign)
     */
    const getEditStock = (
        id: string,
        touch: number | null,
        baseStock: number,
    ): number => {
        const field ='NETWT';

        let existingRestore = 0;
        if (existingUsage) {
           
                existingRestore = (existingUsage.APPIS[id]?.netwt ?? 0)
                    - (existingUsage.APPRE[id]?.netwt ?? 0);
            
        }

        const draftImpact = getDraftNetImpact(id, touch, field);
        return baseStock + existingRestore + draftImpact;
    };

    /**
     * Available pieces (SA/SR only):
     * = basePcs
     *   + existingSA.pcs  (sales was reducing → restore +pcs)
     *   - existingSR.pcs  (sales return was adding → restore -pcs)
     *   + draftImpact
     */
    const getEditStockPcs = (id: string, basePcs: number): number => {
        const existingRestore = existingUsage
            ? (existingUsage.APPIS[id]?.pcs ?? 0) - (existingUsage.APPRE[id]?.pcs ?? 0)
            : 0;
        const draftImpact = getDraftNetImpactPcs(id);

        console.log('getEditStockPcs', id, basePcs, existingRestore, draftImpact );

        return basePcs + existingRestore + draftImpact;
    };

   

    const getAvailableWeightForAPPIS = (itemId: string): number => {
        const stock = itemsStockList.find(s =>
            String(s.itemId) === String(itemId) || String(s.pureId) === String(itemId)
        );
        if (!stock) return 0;
        return getEditStock(itemId, null, Number(stock.NETWT || stock.netwt || 0));
    };

    const getAvailablePcsForAPPIS = (itemId: string): number => {
        const stock = itemsStockList.find(s =>
            String(s.itemId) === String(itemId) || String(s.pureId) === String(itemId)
        );
        if (!stock) return 0;
        const basePcs = Number(stock.PCS ?? stock.pcs ?? stock.pieces ?? 0);
        return getEditStockPcs(itemId, basePcs);
    };

    return {
        getAvailableWeightForAPPIS,
        getAvailablePcsForAPPIS,
        getEditStock,
        getEditStockPcs,
        getDraftNetImpact,
        getDraftNetImpactPcs,
        getSignForRow,
        getOriginalUsage: () => 0, // kept for API compat
    };
}