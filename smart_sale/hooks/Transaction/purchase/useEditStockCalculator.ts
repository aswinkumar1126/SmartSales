// hooks/useEditStockCalculator.ts

interface EditingStockProps {
    pureStockList: any[];
    itemsStockList: any[];
    draftRows: any[];
    originalTransactionData: any;
    TRANSACTIONTYPES: any[];
}

// Transaction type code constants
const ITEM_STOCK_TYPES = ['PU', 'PR'];   // Sales, Sales Return → itemsStockList
const PURE_STOCK_TYPES = ['ISP', 'REC'];   // Issue, Receipt → pureStockList

// For existing rows: these types ADD back to stock (they're being "undone")
const EXISTING_ADD_TYPES = ['PU', 'ISP']; // Sales & Issue when existing → add back

// For new rows: these types ADD to stock
const NEW_ADD_TYPES = ['PR', 'REC']; // Sales Return & Receipt when new → add

export function useEditStockCalculator({
    pureStockList,
    itemsStockList,
    draftRows,
    originalTransactionData,
    TRANSACTIONTYPES,
}: EditingStockProps) {

    /**
     * Determine if a row's weight should be ADDED (+) or SUBTRACTED (-) from stock.
     * 
     * isExisting = true  → opposite of normal (we're reversing the original effect)
     *   SA (Sales):        normally reduces stock → now ADD back
     *   SR (Sales Return): normally adds to stock → now REDUCE
     *   IS (Issue):        normally reduces pure stock → now ADD back
     *   RE (Receipt):      normally adds to pure stock → now REDUCE
     *
     * isExisting = false → normal behavior
     *   SA → reduce, SR → add, IS → reduce, RE → add
     */
    const getSignForRow = (transactionTypeCode: string, isExisting: boolean): 1 | -1 => {
        const normallyAdds = NEW_ADD_TYPES.includes(transactionTypeCode); // SR, RE add stock normally

        if (isExisting) {
            // Flip: existing rows undo their original effect
            return normallyAdds ? -1 : 1;
        } else {
            // Normal: new rows apply their standard effect
            return normallyAdds ? 1 : -1;
        }
    };

    /**
     * Get the stock type ('ISP' | 'PU') based on transaction type code.
     * IS/RE → pure stock (ISP)
     * SA/SR → items stock (PU)
     */
    const getStockTypeForCode = (transactionTypeCode: string): 'ISP' | 'PU' => {
        return PURE_STOCK_TYPES.includes(transactionTypeCode) ? 'ISP' : 'PU';
    };

    /**
     * Get original usage from the saved transaction (before edits).
     * Used to restore stock when editing an existing transaction.
     */
    const getOriginalUsage = (
        id: string,
        touch: number | null,
        field: string,
        type: 'ISP' | 'PU'
    ): number => {
        const details = originalTransactionData?.TRANSACTION_DETAILS;
        if (!details) return 0;

        // ISP = issue/receipt rows, PU = sales/sales-return rows
        const rows = type === 'ISP'
            ? [...(details.issue || []), ...(details.receipt || [])]
            : [...(details.sales || []), ...(details.salesReturn || [])];

        return rows
            .filter(r => {
                const matchId = String(r.PUREID || r.ITEMID) === String(id);
                const matchTouch = type === 'ISP' && touch != null
                    ? Number(r.TOUCH) === Number(touch)
                    : true;
                return matchId && matchTouch;
            })
            .reduce((sum, r) => sum + Number(r[field] || 0), 0);
    };

    /**
     * Calculate net draft impact on stock for a given id/touch.
     * Each draft row contributes +/- based on its type and isExisting flag.
     */
    const getDraftNetImpact = (
        id: string,
        touch: number | null,
        field: string,
        type: 'ISP' | 'PU'
    ): number => {
        return draftRows
            .filter(r => {
                const matchId = String(r.PUREID || r.ITEMID) === String(id);

                const matchTouch = type === 'ISP' && touch != null
                    ? Number(r.ATOUCH ?? r.TOUCH) === Number(touch)
                    : true;
                
                console.log(matchTouch,'matchTouch');

                // Only include rows that belong to this stock type
                const rowStockType = getStockTypeForCode(r.TRANSACTION_TYPE);
                const matchStockType = rowStockType === type;

                return matchId && matchTouch && matchStockType;
            })
            .reduce((sum, r) => {
                const qty = Number(r[field] || 0);
                const sign = getSignForRow(r.TRANSACTION_TYPE, Boolean(r.isExisting));
                return sum + sign * qty;
            }, 0);
    };

    /**
     * Available stock = Base Stock + Net Draft Impact
     * Net draft impact accounts for both new and existing rows with correct signs.
     */
    const getEditStock = (
        id: string,
        touch: number | null,
        baseStock: number,
        type: 'ISP' | 'PU'
    ): number => {
        const field = type === 'ISP' ? 'WT' : 'NETWT';
        const netImpact = getDraftNetImpact(id, touch, field, type);
        return baseStock + netImpact;
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

    return {
        getAvailableWeightForISP,
        getAvailableWeightForPU,
        getEditStock,
        getOriginalUsage,
        getDraftNetImpact,
        getSignForRow,
    };
}