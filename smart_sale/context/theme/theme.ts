export type FontTokens = {
    primary: string;
    heading: string;
    body: string;
    special: string;
    secondary: string;
    body2:string;
};

export type ColorTokens = {
    primary: string;               // brand maroon #80004D
    secondary: string;             // brand gold #D4AF37
    bg: string;                    // page background #FFF2D8
    inverseText: string;           // text on dark/colored surfaces #FFF
    primaryText: string;           // #222
    secondaryText: string;         // #444
    red: string;
    green: string;
    blue: string;
    yellow: string;
    accient:string;
    formColor:string;
    whiteColor:string;
    greyColor:string;
    sideBar:string;
    sideBarFrom:string;
    sideBarTo:string;
    sideBarFont:string;
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
        body2:"Domine, sans-serif",
    },

    colors: {
        primary: "#80004D",
        secondary: "#D4AF37",
        bg: "#FFF2D8",
        inverseText: "#FFFFFF",
        primaryText: "#222222",
        secondaryText: "#5C4A3D",
        red: "#771717",
        green: "#104d26",
        blue: "#3B82F6",
        yellow: "#EAB308",
        accient:"#FFF2D8",
        formColor:'#FFF',
        whiteColor: '#FFF',
        greyColor:'#F5F5F5',
        sideBar:'#5A0038',
        sideBarFrom:'#80004D',
        sideBarTo:'#4A0029',
        sideBarFont: '#EAD9C4'

    },

    fontSizes: {
        heading: "12px",
        headingSm: "10px",
        body: "10px",
        bodySm: "10px",
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
        primary: "#80004D",
        secondary: "#D4AF37",
        bg: "#FFF2D8",
        inverseText: "#FFFFFF",
        primaryText: "#222222",
        secondaryText: "#5C4A3D",
        accient: "#FFF2D8",
        formColor: '#FFF',
        whiteColor: '#FFF',
        greyColor: '#F5F5F5',
        sideBar: '#5A0038',
        sideBarFrom: '#80004D',
        sideBarTo: '#4A0029',
        sideBarFont: '#EAD9C4',
    },
};

export const darkTheme: DesignTokens = {
    ...designTokens,
    colors: {
        ...designTokens.colors,
        primary: "#D4AF37",
        secondary: "#80004D",
        bg: "#1B1210",
        inverseText: "#FFFFFF",
        primaryText: "#F1E4D0",
        secondaryText: "#C9B79C",
        accient: "#3A001F",
        formColor: '#2A1B22',
        whiteColor: '#FFF',
        greyColor: '#2A1B22',
        sideBar: '#2E0019',
        sideBarFrom: '#3A0021',
        sideBarTo: '#1B0010',
        sideBarFont: '#EAD9C4',
    },
};

