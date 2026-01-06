import {
    Alice,
    Nosifer,
    Lustria,
    Rancho,
    Sofia,
    Domine
} from "next/font/google";

// Primary font
export const alice = Alice({
    subsets: ["latin"],
    variable: "--font-alice",
    weight: "400",
});

// Heading font
export const nosifer = Nosifer({
    subsets: ["latin"],
    variable: "--font-nosifer",
    weight: "400",
});

// Body font
export const lustria = Lustria({
    subsets: ["latin"],
    variable: "--font-lustria",
    weight: "400",
});

// Special
export const rancho = Rancho({
    subsets: ["latin"],
    variable: "--font-rancho",
    weight: "400",
});

// Secondary
export const sofia = Sofia({
    subsets: ["latin"],
    variable: "--font-sofia",
    weight: "400",
});
export const domine = Domine({
    subsets: ["latin"],
    variable: "--font-domine",
    weight: "400",
});

// Export ALL in one class string
export const fontVariables =
    `${alice.variable} ${nosifer.variable} ${lustria.variable} ${rancho.variable} ${sofia.variable}  ${domine.variable}`;
