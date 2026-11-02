// Bottom padding so content clears the floating glass tab bar
export const TAB_PAD = 0;
// Height of the floating glass tab bar itself
export const TAB_BAR_HEIGHT = 42;

export const Colors = {
    background: "#EDEDED",
    surface: "#F5F5F5",
    card: "#D9D9D9",
    headerBg: "#D9D9D9",
    border: "#E5E7EB",
    text: "#0A0A0A",
    textSecondary: "#6B7280",
    textMuted: "#9CA3AF",
    // Fill color (button/chip/badge backgrounds) — always pair with a dark
    // foreground on top, in both themes, since this is a light color.
    accent: "#D7F23A",
    // Foreground color (icon/text/border/link on top of a background, not a
    // fill) — theme-aware because raw lemon reads poorly as text on a light
    // background; see getColors() for the light-mode override.
    accentText: "#D7F23A",
    accentLight: "#F3FBD9",
    black: "#000000",
    white: "#FFFFFF",
    purple: "#2D1B45",
    pink: "#E85AA0",

    // dark surfaces (wallet, story viewer)
    darkBg: "#1B1326",
    darkSurface: "#271A38",
    darkCard: "#271A38",
    darkBorder: "#3A2B4D",
    darkText: "#FFFFFF",
    darkTextSecondary: "#9CA3AF",

    storyBorder: "#D7F23A",
};

export type ThemeColors = typeof Colors;

export function getColors(theme: "light" | "dark") {
    if (theme === "light") {
        return { ...Colors, accentText: "#7A9A1E" };
    }
    return {
        ...Colors,
        background: "#1B1326",
        surface: "#271A38",
        card: "#271A38",
        headerBg: "#1B1326",
        border: "#3A2B4D",
        text: "#FFFFFF",
        textSecondary: "#AAAAAA",
        textMuted: "#777777",
        accentLight: "#2E3A14",
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
