import { useState, useEffect } from "react";

export function useSessionStorage<T>(key: string, initialValue: T) {
    // Initialize state with a function to avoid unnecessary sessionStorage reads
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === "undefined") return initialValue;

        try {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error("SessionStorage read error", error);
            return initialValue;
        }
    });

    // Update sessionStorage when state changes
    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                sessionStorage.setItem(key, JSON.stringify(storedValue));
            } catch (error) {
                console.error("SessionStorage write error", error);
            }
        }
    }, [key, storedValue]);

    return [storedValue, setStoredValue] as const;
}