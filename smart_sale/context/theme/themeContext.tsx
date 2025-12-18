"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { DesignTokens } from "./theme";
import { lightTheme, darkTheme } from "./theme";

type ThemeMode = "light" | "dark";

type ThemeContextType = {
    theme: DesignTokens;
    mode: ThemeMode;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
    theme: lightTheme,
    mode: "light",
    toggleTheme: () => { },
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [mode, setMode] = useState<ThemeMode>("light");

    useEffect(() => {
        const saved = localStorage.getItem("theme-mode") as ThemeMode;
        if (saved) setMode(saved);
    }, []);

    const toggleTheme = () => {
        setMode((prev) => {
            const next = prev === "light" ? "dark" : "light";
            localStorage.setItem("theme-mode", next);
            return next;
        });
    };

    const theme = mode === "light" ? lightTheme : darkTheme;

    return (
        <ThemeContext.Provider value={{ theme, mode, toggleTheme }}>
            <div
                style={{
                    backgroundColor: theme.colors.primary,
                    color: theme.colors.primaryText,
                    minHeight: "100vh",
                }}
            >
                {children}
            </div>
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
