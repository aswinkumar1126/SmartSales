export function calculateStoneAmount(
    unit: "g" | "c",
    weight: string,
    pcs: string,
    rate: string,
    calculation: "w" | "p" | "c"
): number {
    const w = parseFloat(weight) || 0;
    const p = parseFloat(pcs) || 0;
    const r = parseFloat(rate) || 0;

    if (unit === "g") {
        if (calculation === "w") return w * r;
        if (calculation === "p") return p * r;
        if (calculation === "c") return w * r * 5;
    } else {
        if (calculation === "w") return (w / 5) * r;
        if (calculation === "p") return p * r;
        if (calculation === "c") return (w / 5) * r * 5;
    }
    return 0;
}