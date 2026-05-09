
export const buildTransactionPayload = ({
    draftRows,
    SALE_TRANSACTION_KEY_MAP,
    normalizeRowForApi,
}: any) => {
    const transactionDetails: Record<string, any[]> = {};

    draftRows.forEach((row: any) => {
        const mappedType = SALE_TRANSACTION_KEY_MAP[row.TRANSACTION_TYPE];
        if (!mappedType) return;

        if (!transactionDetails[mappedType]) {
            transactionDetails[mappedType] = [];
        }

        // ✅ DIRECT ACCESS
        const rowStones = row._stones || [];
        const rowCharges = row._miscCharges || [];
        console.log('rowStones', rowCharges,rowStones)

        const validStones = rowStones.filter((stone: any) =>
            stone.stoneId &&
            stone.stonePcs >= 0 &&
            stone.stoneWeight > 0 &&
            stone.stoneRate >= 0
        );

        const validCharges = rowCharges.filter((charge: any) =>
            charge.chargeId && Number(charge.finalAmount) >= 0
        );

        const normalized = normalizeRowForApi(row, mappedType);

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
                    chargeId: Number(charge.chargeId),
                    chargeAmount: Number(charge.finalAmount),
                })),
            }),
        };

        transactionDetails[mappedType].push(finalRow);
    });

    return transactionDetails;
};