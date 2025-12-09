"use client";

import React, { createContext, useContext, useState } from "react";
import { designTokens, DesignTokens } from "./theme";

type ThemeContextType = {
    theme: DesignTokens;
};

const ThemeContext = createContext<ThemeContextType>({
    theme: designTokens,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme] = useState(designTokens);

    return (
        <ThemeContext.Provider value={{ theme}}>
            {children}
        </ThemeContext.Provider>
    )
};

export const useTheme = () => useContext(ThemeContext);