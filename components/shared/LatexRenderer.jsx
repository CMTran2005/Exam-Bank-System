"use client";

import { useEffect, useState } from "react";
import katex from "katex";

const decodeHtmlEntities = (str) => {
    if (!str) return "";
    return str
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
};

export default function LatexRenderer({ text = "", className = "" }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!text) return null;

    if (!mounted) {
        return <div className={`${className} font-question-text whitespace-pre-wrap`} dangerouslySetInnerHTML={{ __html: text }} />;
    }
    const regex = /(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g;
    const parts = text.split(regex);
    let resultHtml = "";

    parts.forEach((part) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
            const math = decodeHtmlEntities(part.slice(2, -2).trim());
            try {
                const html = katex.renderToString(math, {
                    displayMode: true,
                    throwOnError: false,
                });
                resultHtml += `<div class="block my-3 p-3 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/20 text-[inherit] font-question-math shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] hover:border-primary transition-colors cursor-text select-all">${html}</div>`;
            } catch (e) {
                resultHtml += `<code class="block my-2 p-2 bg-red-50 text-red-500 rounded font-question-math">${part}</code>`;
            }
        } else if (part.startsWith("$") && part.endsWith("$")) {
            const math = decodeHtmlEntities(part.slice(1, -1).trim());
            try {
                const html = katex.renderToString(math, {
                    displayMode: false,
                    throwOnError: false,
                });
                resultHtml += `<span class="inline-flex items-center mx-1 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20 text-blue-950 dark:text-blue-100 font-question-math text-[13.5px] font-semibold align-middle shadow-[0_1px_1px_rgba(0,0,0,0.01)] hover:border-primary transition-all cursor-text select-all">${html}</span>`;
            } catch (e) {
                resultHtml += `<code class="inline-block px-1 bg-red-50 text-red-500 rounded font-question-math">${part}</code>`;
            }
        } else {
            resultHtml += part;
        }
    });

    return (
        <div
            className={`${className} font-question-text whitespace-pre-wrap`}
            dangerouslySetInnerHTML={{ __html: resultHtml }}
        />
    );
}
