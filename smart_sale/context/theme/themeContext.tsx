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


    useEffect(() => {
        const root = document.documentElement;

        root.style.setProperty("--table-border", theme.colors.accient);
        root.style.setProperty("--table-header-bg", theme.colors.accient);
        root.style.setProperty("--table-header-text", theme.colors.whiteColor);
        root.style.setProperty("--table-body-bg", theme.colors.primary);
        root.style.setProperty("--table-body-text", theme.colors.primaryText);
        root.style.setProperty("--table-striped-bg", mode === "dark" ? "#1f2937" : "#f9fafb");
        root.style.setProperty("--table-hover-bg", mode === "dark" ? "#111827" : "#f3f4f6");
    }, [theme, mode]);

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
