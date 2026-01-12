export const safeValue = (
    value: string | undefined,
    collection: { label: string; value: string|undefined }[]
): string|undefined => {
    return collection.some(item => item.value === value) ? value : "";
};