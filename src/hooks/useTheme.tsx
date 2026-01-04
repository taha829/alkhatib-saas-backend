import { useEffect, useState } from "react";

export const useTheme = () => {
    const [theme, setTheme] = useState(() => {
        // Default to light as requested
        return localStorage.getItem("theme") || "light";
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    };

    return { theme, toggleTheme };
};
