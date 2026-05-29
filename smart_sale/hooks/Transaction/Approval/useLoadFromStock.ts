export const useLoadFromStock = () => {

    const createRowFromStock = ({
        stockRow,
        targetType,
        availability,
        draftRows,
    }: any) => {

        // const isIssue = targetType.key === "issue";

        const rowId = `temp-${targetType.value}-${Date.now()}`;

        const baseRow = {
            __rowId: rowId,
            __isNew: true,
            __tempId: rowId,
            __previewSno:
                draftRows.filter((r:any) => r.TRANSACTION_TYPE === targetType.value).length + 1,

            TRANSACTION_TYPE: targetType.value,
            DESCRIPTION: stockRow.DESCRIPTION || "",
        };
        console.log(stockRow,'stockRow');

        // ✅ SALES TYPE (SA)
        const grswt = Number(stockRow.GRSWT || stockRow.grswt || 0);
        const stnwt = Number(stockRow.STNWT || stockRow.stnwt || 0);

        return {
            ...baseRow,

            ITEMID: String(stockRow.ITEMID || ""),
            PCS: stockRow.PCS || 0,

            GRSWT: grswt,
            STNWT: stnwt,
            NETWT: grswt - stnwt,

            TOUCH: stockRow.TOUCH || "",
            PUREWT: stockRow.PUREWT || 0,

            RATE: stockRow.RATE || 0,
            MC: stockRow.MC || 0,
            AMOUNT: stockRow.AMOUNT || 0,

            ITEM_TYPE : "NON_TAGED",
            __isTaged :false ,

            stoneDetails: stockRow.stoneDetails || [],
            otherChargesDetails: stockRow.otherChargesDetails || [],
        };
    };

    return { createRowFromStock };
};