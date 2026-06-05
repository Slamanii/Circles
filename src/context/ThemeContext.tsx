import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type AppTheme = "light" | "dark";

const ThemeContext = createContext<{
    theme: AppTheme;
    toggleTheme: () => void;
}>({ theme: "light", toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<AppTheme>("light");

    useEffect(() => {
        AsyncStorage.getItem("app_theme").then((stored) => {
            if (stored === "light" || stored === "dark") setTheme(stored);
        });
    }, []);

    const toggleTheme = () => {
        setTheme((prev) => {
            const next = prev === "light" ? "dark" : "light";
            AsyncStorage.setItem("app_theme", next);
            return next;
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useAppTheme() {
    return useContext(ThemeContext);
}
