
export const getIsTagEnabled = (tranType?: string) => {
    if (!tranType) return false;
    if (tranType === "PR") {
        return true;
    }
}