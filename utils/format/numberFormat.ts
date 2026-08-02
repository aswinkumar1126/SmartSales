export const formatToFixed = (
    value: string | number | null | undefined,
    decimals: number = 2
): string => {
    if (value === "" || value === null || value === undefined) return "";

    const num = Number(value);
    if (isNaN(num)) return "";

    return num.toFixed(decimals);
};
