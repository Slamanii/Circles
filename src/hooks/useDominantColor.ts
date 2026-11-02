import { useEffect, useState } from "react";
import ImageColors from "react-native-image-colors";

// iOS returns `background`, Android/web return `dominant` — normalize to one value.
export function useDominantColor(uri: string | undefined, fallback: string) {
    const [color, setColor] = useState(fallback);

    useEffect(() => {
        if (!uri) { setColor(fallback); return; }
        let cancelled = false;
        ImageColors.getColors(uri, { fallback, cache: true, key: uri })
            .then((result) => {
                if (cancelled) return;
                const value = result.platform === "ios" ? result.background : result.dominant;
                setColor(value ?? fallback);
            })
            .catch(() => { if (!cancelled) setColor(fallback); });
        return () => { cancelled = true; };
    }, [uri, fallback]);

    return color;
}

// Simple relative-luminance check so card text stays readable regardless of
// what color the flyer's extraction landed on.
export function isLightColor(hex: string): boolean {
    const clean = hex.replace("#", "");
    if (clean.length < 6) return true;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6;
}
