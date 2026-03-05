import React, { createContext, useContext, useRef } from "react";

type NavigatorContextType = {
    register: (key: string, ref: HTMLInputElement | null) => void;
    focusNext: (key: string) => void;
};

const NavigatorContext = createContext<NavigatorContextType | null>(null);

export const useFormNavigator = () => {
    const ctx = useContext(NavigatorContext);
    if (!ctx) throw new Error("useFormNavigator must be used inside FormNavigatorProvider");
    return ctx;
};

type FormNavigatorProps = {
    fieldOrder: string[];
    children: React.ReactNode;
};

export const FormNavigator: React.FC<FormNavigatorProps> = ({ fieldOrder, children }) => {
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const register = (key: string, ref: HTMLInputElement | null) => {
        inputRefs.current[key] = ref;
    };

    const focusNext = (currentKey: string) => {
        const index = fieldOrder.indexOf(currentKey);
        if (index === -1) return;

        const nextKey = fieldOrder[index + 1];
        if (nextKey && inputRefs.current[nextKey]) {
            inputRefs.current[nextKey]?.focus();
        }
    };

    return (
        <NavigatorContext.Provider value={{ register, focusNext }}>
            {children}
        </NavigatorContext.Provider>
    );
};