// Bottom padding so content clears the floating glass tab bar
export const TAB_PAD = 90;

export const Colors = {
    background: "#EDEDED",
    surface: "#F5F5F5",
    card: "#D9D9D9",
    headerBg: "#D9D9D9",
    border: "#E5E7EB",
    text: "#0A0A0A",
    textSecondary: "#6B7280",
    textMuted: "#9CA3AF",
    accent: "#E8622A",
    accentLight: "#FEF2EE",
    black: "#000000",
    white: "#FFFFFF",

    // dark surfaces (wallet, story viewer)
    darkBg: "#2E2D2D",
    darkSurface: "#424040",
    darkCard: "#1C1C1C",
    darkBorder: "#2D2D2D",
    darkText: "#FFFFFF",
    darkTextSecondary: "#9CA3AF",

    storyBorder: "#E8622A",
};

export function getColors(theme: "light" | "dark") {
    if (theme === "light") return Colors;
    return {
        ...Colors,
        background: "#2E2D2D",
        surface: "#3A3939",
        card: "#3A3939",
        headerBg: "#2E2D2D",
        border: "#555555",
        text: "#FFFFFF",
        textSecondary: "#AAAAAA",
        textMuted: "#777777",
        accentLight: "#3D2A24",
    } as typeof Colors;
}

export const Radius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
};

export const Shadow = {
    card: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
};
