export type FontTokens = {
    primary: string;
    heading: string;
    body: string;
    special: string;
    secondary: string;
};

export type ColorTokens = {
    primary: string;               // white
    secondary: string;             // black
    primaryText: string;           // #222
    secondaryText: string;         // #444
    red: string;
    green: string;
    blue: string;
    yellow: string;
    accient:string;
    formColor:string;
    whiteColor:string;
};

export type FontSizeTokens = {
    heading: string;
    headingSm: string;
    body: string;
    bodySm: string;
};

export type SpacingTokens = {
    full: string;
    large: string;
    medium: string;
    low: string;
};

export type DesignTokens = {
    fonts: FontTokens;
    colors: ColorTokens;
    fontSizes: FontSizeTokens;
    spacing: SpacingTokens;
};

export const designTokens: DesignTokens = {
    fonts: {
        primary: "Alice, serif",
        heading: "Nosifer, cursive",
        body: "Lustria, serif",
        special: "Rancho, cursive",
        secondary: "Sofia, cursive",
    },

    colors: {
        primary: "#FBFBFB",
        secondary: "#000000",
        primaryText: "#222222",
        secondaryText: "#444444",
        red: "#EF4444",
        green: "#22C55E",
        blue: "#3B82F6",
        yellow: "#EAB308",
        accient:"#05204bff",
        formColor:'#FFF',
        whiteColor: '#FFF',
    },

    fontSizes: {
        heading: "14px",
        headingSm: "12px",
        body: "12px",
        bodySm: "12px",
    },

    spacing: {
        full: "50%",
        large: "10px",
        medium: "6px",
        low: "4px",
    },
};
export const lightTheme: DesignTokens = {
    ...designTokens,
    colors: {
        ...designTokens.colors,
        primary: "#EEEEEE",
        secondary: "#000000",
        primaryText: "#222",
        secondaryText: "#444444",
        accient:"#1868b2",
        formColor:'#FFF',
        whiteColor:'#FFF',

    },
};

export const darkTheme: DesignTokens = {
    ...designTokens,
    colors: {
        ...designTokens.colors,
        primary: "#000",
        secondary: "#FFFFFF",
        primaryText: "#E5E7EB",
        secondaryText: "#9CA3AF",
        accient:"#001958ff",
        formColor: '#222',
        whiteColor: '#FFF',
    },
};

