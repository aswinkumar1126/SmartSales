import type { Config } from "tailwindcss";
import { designTokens } from "./context/theme/theme";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: designTokens.colors.primary,
                secondary: designTokens.colors.secondary,
                "primary-text": designTokens.colors.primaryText,
                "secondary-text": designTokens.colors.secondaryText,
                red: designTokens.colors.red,
                green: designTokens.colors.green,
                blue: designTokens.colors.blue,
                yellow: designTokens.colors.yellow,
            },
            fontFamily: {
                primary: [designTokens.fonts.primary],
                heading: [designTokens.fonts.heading],
                body: [designTokens.fonts.body],
                special: [designTokens.fonts.special],
                secondary: [designTokens.fonts.secondary],
            },
            fontSize: {
                heading: designTokens.fontSizes.heading,
                "heading-sm": designTokens.fontSizes.headingSm,
                body: designTokens.fontSizes.body,
                "body-sm": designTokens.fontSizes.bodySm,
            },
            spacing: {
                full: designTokens.spacing.full,
                large: designTokens.spacing.large,
                medium: designTokens.spacing.medium,
                low: designTokens.spacing.low,
            },
        },
    },
    plugins: [],
};

export default config;
