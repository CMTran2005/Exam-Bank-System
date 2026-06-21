"use client";

import { useId, useState, useRef, useEffect } from "react";
import RichTextToolbar from "./RichTextToolbar";

/**
 * Component RichInput
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @param {Object} 
    id - Tham số đầu vào
 * @returns {JSX.Element}
 */
export default function RichInput({
    id,
    value = "",
    onChange,
    placeholder,
    disabled = false,
    className = ""
}) {
    const defaultId = useId();
    const targetId = id || defaultId;
    const editorRef = useRef(null);
    const containerRef = useRef(null);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || "";
        }
    }, [value]);

    const handleInput = (e) => {
        if (onChange) {
            onChange(e.target.innerHTML);
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = (e) => {
        setTimeout(() => {
            if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
                setIsFocused(false);
            }
        }, 180);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
        }
    };

    const escapedSelectorId = targetId.replace(/:/g, "\\:");

    return (
        <div
            ref={containerRef}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className="flex flex-col w-full rounded-xl border border-border shadow-sm focus-within:ring-1 focus-within:ring-ring focus-within:border-ring overflow-hidden bg-background transition-all duration-200"
        >
            {isFocused && (
                <div className="border-b border-border/40 animate-in slide-in-from-top-2 duration-150">
                    <RichTextToolbar
                        targetId={targetId}
                        value={value}
                        onChange={onChange}
                    />
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                #${escapedSelectorId}:empty:before {
                    content: attr(placeholder);
                    color: rgb(156 163 175 / 0.6);
                    pointer-events: none;
                    display: inline-block;
                }
            `}} />

            <div
                id={targetId}
                ref={editorRef}
                contentEditable={!disabled}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={`w-full min-h-[36px] h-9 px-3 py-1.5 font-question-text font-medium outline-none border-0 bg-slate-50/40 dark:bg-slate-950/20 hover:bg-slate-50/60 dark:hover:bg-slate-950/30 focus:bg-background dark:focus:bg-background/80 transition-colors duration-150 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center ${className}`}
            />
        </div>
    );
}
