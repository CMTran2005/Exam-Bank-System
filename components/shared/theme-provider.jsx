"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// Ẩn cảnh báo React 19 "Encountered a script tag" do next-themes gây ra
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    const orig = console.error;
    console.error = (...args) => {
        if (typeof args[0] === "string" && args[0].includes("Encountered a script tag")) {
            return;
        }
        orig.apply(console, args);
    };
}

/**
 * Component ThemeProvider
 * Xử lý logic và chức năng liên quan.
 *
 * @param {any}  children - Tham số đầu vào
 * @returns {JSX.Element}
 */
export function ThemeProvider({ children, ...props }) {
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
