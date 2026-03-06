import { useEffect, useRef } from "react";
import { registerKey, unregisterKey } from "./globalKeyManager";

export function useGlobalKey(
    key: string,
    callback: (event: KeyboardEvent) => void,
    componentId?: string
) {
    const idRef = useRef(
        componentId || `${key}-${Math.random().toString(36).slice(2)}`
    );

    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        const id = idRef.current;

        const wrappedCallback = (event: KeyboardEvent) => {
            callbackRef.current(event);
        };

        registerKey(id, key, wrappedCallback);

        return () => {
            unregisterKey(id, key);
        };
    }, [key]);
}