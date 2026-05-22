// ── Pure function — no hooks ──────────────────────────────────────────────
export function MapOtherCharges(
    item: any,
    rowId: string,
    isUseFinalAmount: boolean,        // ✅ passed in, not fetched inside
) {

    const miscChargesRaw = item.OTHERCHARGESDETAILS || [];

    const normalizedMisc = miscChargesRaw.map((c: any, i: number) => {
        const finalAmt = Number(c.chargeAmount || 0);
        console.log(finalAmt, 'finalAmt')
        const isHmc = c?.chargeName?.trim().toUpperCase() === "HMC";

        // Per-piece amount (used in grid editing)
        const perPieceAmount = isHmc && isUseFinalAmount
            ? finalAmt / Number(item.PCS || 1)
            : finalAmt;

        return {
            id: `misc-${rowId}-${i}`,
            draftRowId: rowId,
            chargeId: String(c.chargeId || 0),
            chargeName: c.chargeName || String(c.chargeId || 0),
            amount: perPieceAmount,
            finalAmount: finalAmt,
            itemId: Number(c.itemId || item.ITEMID || 0),
        };
    });

    const totalHMC =
        normalizedMisc.length > 0
            ? normalizedMisc.reduce(
                (sum: number, c: any) =>
                    // ✅ Use finalAmount or perPieceAmount based on control flag
                    sum + (c.finalAmount),
                0
            )
            : Number(item.HMC || 0);

    return { normalizedMisc, totalHMC };
}