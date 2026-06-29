import Decimal from "decimal.js";

export function recalcRow(row: Record<string, any>, isIssue: boolean) {

    const g = new Decimal(row.GRSWT || 0);
    const s = new Decimal(row.STNWT || 0);

    const touch = new Decimal(row.TOUCH || 0);

    const wt = new Decimal(row.WT || 0);

    const awt = new Decimal(row.AWT || 0);

    const atouch = new Decimal(row.ATOUCH || 0);

    const calMode = row.CAL_MODE || "NETWT";

    const netWt = g.minus(s);

    row.NETWT = netWt
        .toDecimalPlaces(3)
        .toFixed(3);

    const baseWt = calMode === "NETWT"
        ? netWt
        : g;

    const pureWt = baseWt
        .times(touch)
        .div(100);

    const issuePureWt = wt
        .times(touch)
        .div(100);

    const aPureWt = awt
        .times(atouch)
        .div(100);

    row.PUREWT = isIssue
        ? issuePureWt.toDecimalPlaces(3).toFixed(3)
        : pureWt.toDecimalPlaces(3).toFixed(3);

    row.APUREWT = aPureWt
        .toDecimalPlaces(3)
        .toFixed(3);

    return row;
}