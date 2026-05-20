// hooks/useEditStockCalculator.ts

interface EditingStockProps {
    pureStockList: any[];
    itemsStockList: any[];
    draftRows: any[];
    originalTransactionData: any;
    SALETRANSACTIONTYPES: any[];
    existingUsage?: {
        is: Record<string, { wt: number }>;   // Issue rows  (adds pure stock → restore +wt)
        re: Record<string, { wt: number }>;   // Receipt rows (reduces pure stock → restore -wt)
        sa: Record<string, { netwt: number; pcs: number }>;  // Sales (reduces items → restore +)
        sr: Record<string, { netwt: number; pcs: number }>;  // Sales Return (adds items → restore -)
    };
}

const PURE_STOCK_CODES = ['IS', 'IR'];   // Issue, Receipt → pureStockList
const ITEM_STOCK_CODES = ['SA', 'SR'];   // Sales, Sales Return → itemsStockList

// These REDUCE available stock (new draft row = takes from stock)
const REDUCES_STOCK_CODES = ['IS', 'SA'];
// These ADD to available stock (new draft row = returns to stock)
const ADDS_STOCK_CODES = ['IR', 'SR'];

export function useEditStockCalculator({
    pureStockList,
    itemsStockList,
    draftRows,
    originalTransactionData,
    SALETRANSACTIONTYPES,
    existingUsage,
}: EditingStockProps) {

    const getStockTypeForCode = (code: string): 'IS' | 'SA' => {
        return PURE_STOCK_CODES.includes(code) ? 'IS' : 'SA';
    };

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
        touch: number | null,
        type: 'IS' | 'SA'
    ) => {
        return draftRows.filter(r => {
            const matchId = String(r.PUREID || r.ITEMID) === String(id);
            const matchTouch = type === 'IS' && touch != null
                ? Number(r.ATOUCH ?? r.TOUCH) === Number(touch)
                : true;
            const matchStockType = getStockTypeForCode(r.TRANSACTION_TYPE) === type;
            return matchId && matchTouch && matchStockType;
        });
    };

    const getDraftNetImpact = (
        id: string,
        touch: number | null,
        field: string,
        type: 'IS' | 'SA'
    ): number => {
        return filterDraftRows(id, touch, type)
            .reduce((sum, r) => {
                const qty = Number(r[field] || 0);
                const sign = getSignForRow(r.TRANSACTION_TYPE);
                return sum + sign * qty;
            }, 0);
    };

    const getDraftNetImpactPcs = (id: string): number => {
        return filterDraftRows(id, null, 'SA')
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
        type: 'IS' | 'SA'
    ): number => {
        const field = type === 'IS' ? 'WT' : 'NETWT';

        let existingRestore = 0;
        if (existingUsage) {
            if (type === 'IS') {
                const key = `${id}_${touch ?? ''}`;
                // IS was reducing pure stock → restore = +wt
                // IR was adding pure stock  → restore = -wt
                existingRestore = (existingUsage.is[key]?.wt ?? 0)
                    - (existingUsage.re[key]?.wt ?? 0);
            } else {
                // SA was reducing items stock → restore = +netwt
                // SR was adding items stock  → restore = -netwt
                existingRestore = (existingUsage.sa[id]?.netwt ?? 0)
                    - (existingUsage.sr[id]?.netwt ?? 0);
            }
        }

        const draftImpact = getDraftNetImpact(id, touch, field, type);
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
            ? (existingUsage.sa[id]?.pcs ?? 0) - (existingUsage.sr[id]?.pcs ?? 0)
            : 0;
        const draftImpact = getDraftNetImpactPcs(id);
        return basePcs + existingRestore + draftImpact;
    };

    const getAvailableWeightForIS = (pureId: string, touch: number | null): number => {
        const stock = pureStockList.find(
            s => String(s.pureId) === String(pureId) && Number(s.aTouch) === Number(touch)
        );
        if (!stock) return 0;
        return getEditStock(pureId, touch, Number(stock.aWt || 0), 'IS');
    };

    const getAvailableWeightForSA = (itemId: string): number => {
        const stock = itemsStockList.find(s =>
            String(s.itemId) === String(itemId) || String(s.pureId) === String(itemId)
        );
        if (!stock) return 0;
        return getEditStock(itemId, null, Number(stock.NETWT || stock.netwt || 0), 'SA');
    };

    const getAvailablePcsForSA = (itemId: string): number => {
        const stock = itemsStockList.find(s =>
            String(s.itemId) === String(itemId) || String(s.pureId) === String(itemId)
        );
        if (!stock) return 0;
        const basePcs = Number(stock.PCS ?? stock.pcs ?? stock.pieces ?? 0);
        return getEditStockPcs(itemId, basePcs);
    };

    return {
        getAvailableWeightForIS,
        getAvailableWeightForSA,
        getAvailablePcsForSA,
        getEditStock,
        getEditStockPcs,
        getDraftNetImpact,
        getDraftNetImpactPcs,
        getSignForRow,
        getOriginalUsage: () => 0, // kept for API compat
    };
}