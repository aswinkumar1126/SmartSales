interface EditingStockProps {
    pureStockList: any[];
    itemsStockList: any[];
    draftRows: any[];

}



const PURE_CODES = ["IS", "RE"];
const ITEM_CODES = ["SA", "SR"];

const ADD_STOCK = ["RE", "SR"];   // increase stock
const REDUCE_STOCK = ["IS", "SA"]; // decrease stock

export function useEditStockCalculator({
    pureStockList,
    itemsStockList,
    draftRows,
}: EditingStockProps) {

    // ---------------- SIGN ----------------
    const getSignForRow = (code: string): 1 | -1 => {
        return ADD_STOCK.includes(code) ? 1 : -1;
    };

    const isPure = (code: string) => PURE_CODES.includes(code);
    const isItem = (code: string) => ITEM_CODES.includes(code);

    // ---------------- FILTER ----------------
    const filterDraftRows = (id: string, touch: number | null, type: "IS" | "SA") => {
        return draftRows.filter(r => {
            const matchId = String(r.PUREID || r.ITEMID) === String(id);

            const matchTouch =
                type === "IS" && touch != null
                    ? Number(r.ATOUCH ?? r.TOUCH) === Number(touch)
                    : true;

            const matchType =
                type === "IS"
                    ? PURE_CODES.includes(r.TRANSACTION_TYPE)
                    : ITEM_CODES.includes(r.TRANSACTION_TYPE);

            return matchId && matchTouch && matchType;
        });
    };

    // ---------------- DRAFT WT ----------------
    const getDraftNetImpact = (
        id: string,
        touch: number | null,
        field: string,
        type: "IS" | "SA"
    ): number => {
        return filterDraftRows(id, touch, type).reduce((sum, r) => {
            const qty = Number(r[field] || 0);
            const sign = getSignForRow(r.TRANSACTION_TYPE);
            return sum + sign * qty;
        }, 0);
    };

    // ---------------- PCS ----------------
    const getDraftNetImpactPcs = (id: string): number => {
        return filterDraftRows(id, null, "SA").reduce((sum, r) => {
            const qty = Number(r.PCS || 0);
            const sign = getSignForRow(r.TRANSACTION_TYPE);
            return sum + sign * qty;
        }, 0);
    };

    // ---------------- STN WT ----------------
    const getDraftNetImpactStnWt = (id: string): number => {
        return draftRows
            .filter(r => String(r.ITEMID || r.PUREID) === String(id))
            .reduce((sum, r) => {
                const sign = getSignForRow(r.TRANSACTION_TYPE);
                return sum + sign * Number(r.STNWT || 0);
            }, 0);
    };

    // ---------------- MAIN STOCK CALC ----------------
    const getEditStock = (
        id: string,
        touch: number | null,
        baseStock: number,
        type: "IS" | "SA"
    ): number => {

        let restore = 0;


        const field = type === "IS" ? "WT" : "NETWT";
        const draftImpact = getDraftNetImpact(id, touch, field, type);

        return baseStock + restore + draftImpact;
    };

    // ---------------- PCS ----------------
    const getEditStockPcs = (id: string, basePcs: number): number => {
       

        const draftImpact = getDraftNetImpactPcs(id);

        return basePcs + draftImpact;
    };

    // ---------------- PURE STOCK (IS / RE) ----------------
    const getAvailableWeightForPure = (pureId: string, touch: number | null): number => {
        const stock = pureStockList.find(
            s =>
                String(s.pureId) === String(pureId) &&
                Number(s.aTouch) === Number(touch)
        );

        if (!stock) return 0;

        return getEditStock(pureId, touch, Number(stock.aWt || 0), "IS");
    };

    // ---------------- ITEM STOCK (SA / SR) ----------------
    const getAvailableWeightForSA = (itemId: string): number => {
        const stock = itemsStockList.find(
            s =>
                String(s.itemId) === String(itemId) ||
                String(s.pureId) === String(itemId)
        );

        if (!stock) return 0;

        return getEditStock(itemId, null, Number(stock.NETWT || 0), "SA");
    };

    const getAvailablePcsForSA = (itemId: string): number => {
        const stock = itemsStockList.find(
            s =>
                String(s.itemId) === String(itemId) ||
                String(s.pureId) === String(itemId)
        );

        if (!stock) return 0;

        return getEditStockPcs(itemId, Number(stock.PCS || 0));
    };

    return {
        getEditStock,
        getEditStockPcs,

        getDraftNetImpact,
        getDraftNetImpactPcs,
        getDraftNetImpactStnWt,

        getAvailableWeightForPure, // IS / RE
        getAvailableWeightForSA,   // SA / SR
        getAvailablePcsForSA,
    };
}