export const parseFixedNumber = (
    value: number|string,
    decimals: number = 2
): number => {
    if (value === "") return 0;

    const num = Number(value);
    if (isNaN(num)) return 0;

    return Number(num.toFixed(decimals));
};
