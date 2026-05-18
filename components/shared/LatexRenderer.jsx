"use client";

import { useEffect, useState } from "react";
import katex from "katex";

export default function LatexRenderer({ text = "", className = "" }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!text) return null;

    // Before mounting on client, return raw text to prevent SSR mismatch
    if (!mounted) {
        return <span className={className}>{text}</span>;
    }

    // Split text into text segments and LaTeX segments
    // Matches $$...$$ or $...$
    const regex = /(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g;
    const parts = text.split(regex);

    return (
        <span className={className}>
            {parts.map((part, idx) => {
                if (part.startsWith("$$") && part.endsWith("$$")) {
                    const math = part.slice(2, -2).trim();
                    try {
                        const html = katex.renderToString(math, {
                            displayMode: true,
                            throwOnError: false,
                        });
                        return (
                            <span
                                key={idx}
                                className="block my-3 p-3 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/20 text-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] hover:border-primary transition-colors cursor-text select-all"
                                dangerouslySetInnerHTML={{ __html: html }}
                            />
                        );
                    } catch (e) {
                        return <code key={idx} className="block my-2 p-2 bg-red-50 text-red-500 rounded">{part}</code>;
                    }
                } else if (part.startsWith("$") && part.endsWith("$")) {
                    const math = part.slice(1, -1).trim();
                    try {
                        const html = katex.renderToString(math, {
                            displayMode: false,
                            throwOnError: false,
                        });
                        return (
                            <span
                                key={idx}
                                className="inline-flex items-center mx-1 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20 text-blue-950 dark:text-blue-100 font-serif text-[13.5px] font-semibold align-middle shadow-[0_1px_1px_rgba(0,0,0,0.01)] hover:border-primary transition-all cursor-text select-all"
                                dangerouslySetInnerHTML={{ __html: html }}
                            />
                        );
                    } catch (e) {
                        return <code key={idx} className="inline-block px-1 bg-red-50 text-red-500 rounded">{part}</code>;
                    }
                } else {
                    return <span key={idx} className="whitespace-pre-wrap">{part}</span>;
                }
            })}
        </span>
    );
}
