export const buildTransactionPayload = ({
    draftRows,
    stonesByDraftRowId,
    chargesByDraftRowId,
    SALE_TRANSACTION_KEY_MAP,
    normalizeRowForApi,
    isTagedItem,
}: any) => {

    const transactionDetails: Record<string, any[]> = {};

    draftRows.forEach((row: any) => {

        const mappedType = SALE_TRANSACTION_KEY_MAP[row.TRANSACTION_TYPE];
        if (!mappedType) return;

        if (!transactionDetails[mappedType]) {
            transactionDetails[mappedType] = [];
        }

        // ---------------- STONES ----------------
        const rowStones = stonesByDraftRowId[row.__rowId] || [];

        const validStones = rowStones.filter((stone: any) =>
            stone.stoneId &&
            stone.stonePcs > 0 &&
            stone.stoneWeight > 0 &&
            stone.stoneRate > 0
        );

        // ---------------- CHARGES ----------------
        const rowCharges =
            row._miscCharges || chargesByDraftRowId[row.__rowId] || [];

        const validCharges = rowCharges.filter((charge: any) =>
            charge.id && Number(charge.amount) > 0
        );

        // ---------------- NORMALIZE ----------------
        const normalized = normalizeRowForApi(
            row,
            mappedType,
            isTagedItem
        );

        // ---------------- FINAL OBJECT ----------------
        const finalRow = {
            ...normalized,

            ...(validStones.length > 0 && {
                STONEDETAILS: validStones.map((stone: any) => ({
                    stoneId: stone.stoneId,
                    subStoneId: stone.subStoneId,
                    stonePcs: stone.stonePcs,
                    stoneWeight: stone.stoneWeight,
                    stoneUnit: stone.stoneUnit,
                    stoneCalculation: stone.stoneCalculation,
                    stoneRate: stone.stoneRate,
                    stoneAmount: stone.stoneAmount,
                })),
            }),

            ...(validCharges.length > 0 && {
                OTHERCHARGESDETAILS: validCharges.map((charge: any) => ({
                    chargeId: Number(charge.chargeName),
                    chargeAmount: charge.amount,
                })),
            }),
        };

        transactionDetails[mappedType].push(finalRow);
    });

    return transactionDetails;
};