export const useLoadPurchaseStock = () => {

    const createRowFromStock = ({
        stockRow,
        targetType,
        availability,
        draftRows,
    }: any) => {

        const isIssue = targetType.key === "issue";

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

        // ✅ ISSUE TYPE (IS)
        if (isIssue) {
            const availableWeight = availability?.remaining || 0;

            console.log(stockRow,'stockRowstockRow')
            return {
                ...baseRow,

                PUREID: stockRow.pureId || "",

                WT: availableWeight,
                AWT: availableWeight,

                TOUCH: stockRow.aTouch || "",
                ATOUCH: stockRow.aTouch || "",

                PUREWT: stockRow.actualPure || 0,
                APUREWT: stockRow.actualPure || 0,

                // 🔥 Optional stock tracking (very useful)
                _stock: {
                    total: availability?.total || 0,
                    used: availability?.used || 0,
                    remaining: availableWeight,
                },
            };
        }

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

            stoneDetails: stockRow.stoneDetails || [],
            otherChargesDetails: stockRow.otherChargesDetails || [],
        };
    };

    return { createRowFromStock };
};