// hooks/useEditStockCalculator.ts

interface EditingStockProps {
    pureStockList: any[];
    itemsStockList: any[];
    draftRows: any[];
    originalTransactionData: any;
    TRANSACTIONTYPES: any[];
    // ✅ Pre-computed existing usage passed in directly when editing
    existingUsage?: {
        isp: Record<string, { wt: number }>;   // Issue rows (adds stock → restore +wt)
        rec: Record<string, { wt: number }>;   // Receipt rows (reduces stock → restore -wt)
        pu: Record<string, { netwt: number; pcs: number }>;  // Purchase rows (adds → restore +)
        pr: Record<string, { netwt: number; pcs: number }>;  // Purchase Return (reduces → restore -)
    };
}

const PURE_STOCK_CODES = ['ISP', 'REC'];
const ITEM_STOCK_CODES = ['PU', 'PR'];

// All transaction types reduce stock when new (drafting)
// baseStock + existingUsed - draftUsed = available
const REDUCES_STOCK_CODES = ['ISP', 'PU']; // Issue reduces pure, Purchase reduces items
// REC and PR add to stock (returns/receipts)
const ADDS_STOCK_CODES = ['REC', 'PR'];

export function useEditStockCalculator({
    pureStockList,
    itemsStockList,
    draftRows,
    originalTransactionData,
    TRANSACTIONTYPES,
    existingUsage,
}: EditingStockProps) {

    const getStockTypeForCode = (transactionTypeCode: string): 'ISP' | 'PU' => {
        return PURE_STOCK_CODES.includes(transactionTypeCode) ? 'ISP' : 'PU';
    };

    /**
     * Sign for NEW draft rows only (isExisting removed):
     * ISP / PU → -1 (reduce stock)
     * REC / PR → +1 (add to stock)
     */
    const getSignForRow = (transactionTypeCode: string): 1 | -1 => {
        return ADDS_STOCK_CODES.includes(transactionTypeCode) ? 1 : -1;
    };

    /**
     * Shared filter for draft rows by id + touch + stock type
     */
    const filterDraftRows = (
        id: string,
        touch: number | null,
        type: 'ISP' | 'PU'
    ) => {
        return draftRows.filter(r => {
            const matchId = String(r.PUREID || r.ITEMID) === String(id);
            const matchTouch = type === 'ISP' && touch != null
                ? Number(r.ATOUCH ?? r.TOUCH) === Number(touch)
                : true;
            const matchStockType = getStockTypeForCode(r.TRANSACTION_TYPE) === type;
            return matchId && matchTouch && matchStockType;
        });
    };

    /**
     * Net weight impact of current draft rows
     */
    const getDraftNetImpact = (
        id: string,
        touch: number | null,
        field: string,
        type: 'ISP' | 'PU'
    ): number => {
        return filterDraftRows(id, touch, type)
            .reduce((sum, r) => {
                const qty = Number(r[field] || 0);
                const sign = getSignForRow(r.TRANSACTION_TYPE);
                return sum + sign * qty;
            }, 0);
    };

    /**
     * Net pieces impact of current draft rows (PU only)
     */
    const getDraftNetImpactPcs = (id: string): number => {
        return filterDraftRows(id, null, 'PU')
            .reduce((sum, r) => {
                const qty = Number(r.PCS || 0);
                const sign = getSignForRow(r.TRANSACTION_TYPE);
                return sum + sign * qty;
            }, 0);
    };

    /**
     * Available weight:
     * = baseStock + existingUsed (restore what was originally consumed) - draftNetImpact
     *
     * existingUsed is passed in directly — no row scanning needed
     */
    const getEditStock = (
        id: string,
        touch: number | null,
        baseStock: number,
        type: 'ISP' | 'PU'
    ): number => {
        const field = type === 'ISP' ? 'WT' : 'NETWT';

        let existingRestore = 0;
        if (existingUsage) {
            if (type === 'ISP') {
                const key = `${id}_${touch ?? ''}`;
                // ISP (Issue) was adding stock → restore = +wt
                // REC (Receipt) was reducing stock → restore = -wt
                existingRestore = (existingUsage.isp[key]?.wt ?? 0)
                    - (existingUsage.rec[key]?.wt ?? 0);
            } else {
                // PU (Purchase) was adding stock → restore = +netwt
                // PR (Purchase Return) was reducing stock → restore = -netwt
                existingRestore = (existingUsage.pu[id]?.netwt ?? 0)
                    - (existingUsage.pr[id]?.netwt ?? 0);
            }
        }

        const draftImpact = getDraftNetImpact(id, touch, field, type);
        return baseStock + existingRestore + draftImpact;
    };

    const getEditStockPcs = (id: string, basePcs: number): number => {
        // PU was adding pieces → restore = +pcs
        // PR was reducing pieces → restore = -pcs
        const existingRestore = existingUsage
            ? (existingUsage.pu[id]?.pcs ?? 0) - (existingUsage.pr[id]?.pcs ?? 0)
            : 0;

        const draftImpact = getDraftNetImpactPcs(id);
        return basePcs + existingRestore + draftImpact;
    };

    const getAvailableWeightForISP = (pureId: string, touch: number | null): number => {
        const stock = pureStockList.find(
            s => String(s.pureId) === String(pureId) && Number(s.aTouch) === Number(touch)
        );
        if (!stock) return 0;
        return getEditStock(pureId, touch, Number(stock.aWt || 0), 'ISP');
    };

    const getAvailableWeightForPU = (itemId: string): number => {
        const stock = itemsStockList.find(s =>
            String(s.itemId) === String(itemId) || String(s.pureId) === String(itemId)
        );
        if (!stock) return 0;
        return getEditStock(itemId, null, Number(stock.netwt || 0), 'PU');
    };

    const getAvailablePcsForPU = (itemId: string): number => {
        const stock = itemsStockList.find(s =>
            String(s.itemId) === String(itemId) || String(s.pureId) === String(itemId)
        );
        if (!stock) return 0;
        const basePcs = Number(stock.PCS ?? stock.pcs ?? stock.pieces ?? stock.quantity ?? 0);
        return getEditStockPcs(itemId, basePcs);
    };

    return {
        getAvailableWeightForISP,
        getAvailableWeightForPU,
        getAvailablePcsForPU,
        getEditStock,
        getEditStockPcs,
        getDraftNetImpact,
        getDraftNetImpactPcs,
        getSignForRow,
        getOriginalUsage: () => 0, // kept for API compat, no longer needed
    };
}