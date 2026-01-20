export const safeValue = (
    value: string | undefined,
    collection: { label: string; value: string|undefined }[]
): string|undefined => {
    return collection.some(item => item.value === value) ? value : "";
};


export const safeLabel = (
    value: string | undefined,
    collection: { label: string; value: string | undefined }[]
): string => {
    const found = collection.find(item => item.value === value);
    return found ? found.label : "";
};
