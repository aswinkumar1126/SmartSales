export const setStorage = (key: string, value: unknown) => {
    sessionStorage.setItem(key, JSON.stringify(value));
};

export const getStorage = <T = any>(key: string): T | null => {
    try {
        const item = sessionStorage.getItem(key);
        if (!item) return null;
        return JSON.parse(item) as T;
    } catch (err) {
        console.warn("Invalid JSON in storage for key:", key);
        return null;
    }
};

export const removeStorage = (key: string) => {
    sessionStorage.removeItem(key);
};
