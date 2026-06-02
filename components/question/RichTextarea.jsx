/**
 * @file RichTextarea.jsx
 * @description Hộp nhập liệu nội dung lớn (Textarea) có định dạng và tích hợp thanh công cụ OCR.
 * Sử dụng thuộc tính contentEditable của HTML5 để hỗ trợ hiển thị thẻ HTML trực quan (Bold, Italic, Latex, v.v.).
 */

"use client";

import { useId, useRef, useEffect, useState } from "react";
import RichTextToolbar from "./RichTextToolbar";

/**
 * Component chính của ô nhập liệu nội dung lớn có định dạng.
 * @param {string} id - Định danh duy nhất của ô nhập liệu
 * @param {string} value - Giá trị văn bản định dạng dạng HTML
 * @param {function} onChange - Hàm callback khi người dùng thay đổi dữ liệu
 * @param {string} placeholder - Gợi ý khi ô nhập trống
 * @param {number} rows - Số dòng hiển thị tối thiểu
 * @param {boolean} disabled - Vô hiệu hóa ô nhập liệu
 * @param {string} className - Class CSS tùy chỉnh bên ngoài
 * @param {function} onPaste - Sự kiện khi dán văn bản hoặc ảnh
 */
const sanitizeHtml = (html) => {
    if (typeof window === "undefined") return html;
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        doc.querySelectorAll("script, style, link, meta").forEach((el) => el.remove());
        const all = doc.body.getElementsByTagName("*");
        for (let i = 0; i < all.length; i++) {
            const el = all[i];
            const allowedAttrs = ["href", "src", "alt", "target"];
            const attrs = Array.from(el.attributes);
            attrs.forEach((attr) => {
                if (!allowedAttrs.includes(attr.name)) {
                    el.removeAttribute(attr.name);
                }
            });
        }
        return doc.body.innerHTML;
    } catch (e) {
        console.error("Lỗi khi làm sạch HTML:", e);
        return html;
    }
};

export default function RichTextarea({
    id,
    value = "",
    onChange,
    placeholder,
    rows = 3,
    disabled = false,
    className = "",
    onPaste
}) {
    const defaultId = useId();
    const targetId = id || defaultId;
    const editorRef = useRef(null);

    // Trạng thái cho Math Formula Autocomplete
    const [showMathSuggest, setShowMathSuggest] = useState(false);
    const [mathSuggestPos, setMathSuggestPos] = useState({ top: 0, left: 0 });
    const [isCleaningWord, setIsCleaningWord] = useState(false);

    // Danh sách gợi ý công thức toán học phổ biến
    const MATH_SUGGESTIONS = [
        { label: "Phân số", latex: "\\frac{a}{b}" },
        { label: "Căn bậc 2", latex: "\\sqrt{x}" },
        { label: "Tích phân", latex: "\\int_{a}^{b} f(x) dx" },
        { label: "Tổng Sigma", latex: "\\sum_{i=1}^{n} x_i" },
        { label: "Ma trận 2x2", latex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}" },
        { label: "Giới hạn (lim)", latex: "\\lim_{x \\to 0} f(x)" },
        { label: "Vô cùng", latex: "\\infty" },
        { label: "Đạo hàm", latex: "f'(x)" },
        { label: "Pi", latex: "\\pi" },
        { label: "Hệ phương trình", latex: "\\begin{cases} x+y=1 \\\\ x-y=0 \\end{cases}" },
    ];

    // Đồng bộ giá trị từ component cha vào innerHTML của div contentEditable khi value thay đổi
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || "";
        }
    }, [value]);

    const handleInput = (e) => {
        const html = e.target.innerHTML;
        if (onChange) onChange(html);

        // Kiểm tra logic Autocomplete khi gõ dấu '\' hoặc '/'
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        const range = selection.getRangeAt(0);
        
        // Lấy node text hiện tại và vị trí con trỏ
        const textNode = range.startContainer;
        if (textNode.nodeType === Node.TEXT_NODE) {
            const textToCursor = textNode.textContent.substring(0, range.startOffset);
            // Nếu người dùng vừa gõ '\' (để gọi lệnh LaTeX)
            if (textToCursor.endsWith("\\")) {
                const rect = range.getBoundingClientRect();
                const editorRect = editorRef.current.getBoundingClientRect();
                setMathSuggestPos({
                    top: rect.bottom - editorRect.top + 8,
                    left: rect.left - editorRect.left,
                });
                setShowMathSuggest(true);
            } else if (!textToCursor.includes("\\")) {
                setShowMathSuggest(false);
            }
        }
    };

    const handleMathSelect = (latex) => {
        document.execCommand("insertText", false, latex);
        setShowMathSuggest(false);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const handleLocalPaste = async (e) => {
        // Cho phép component cha (QuestionForm) ưu tiên xử lý ảnh OCR
        if (onPaste) {
            onPaste(e);
            if (e.defaultPrevented) return;
        }

        const htmlData = e.clipboardData.getData("text/html");
        
        // Phát hiện nội dung copy từ Microsoft Word hoặc MathType
        if (htmlData && (htmlData.includes("urn:schemas-microsoft-com:office:word") || htmlData.includes("MsoNormal") || htmlData.includes("<m:math") || htmlData.includes("MathType"))) {
            e.preventDefault();
            setIsCleaningWord(true);
            
            try {
                // Gọi AI để dọn dẹp HTML bẩn từ Word và chuyển MathML/MathType sang LaTeX chuẩn
                const response = await fetch("/api/ai", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "clean_word_html",
                        content: htmlData
                    })
                });

                const data = await response.json();
                if (data.clean_content) {
                    // Chèn nội dung sạch vào vị trí con trỏ
                    document.execCommand("insertHTML", false, data.clean_content);
                    if (editorRef.current) {
                        onChange(editorRef.current.innerHTML);
                    }
                } else {
                    // Fallback: Nếu AI lỗi, dán plain text
                    const plainText = e.clipboardData.getData("text/plain");
                    document.execCommand("insertText", false, plainText);
                }
            } catch (err) {
                console.error("Lỗi khi xử lý nội dung Word:", err);
                const plainText = e.clipboardData.getData("text/plain");
                document.execCommand("insertText", false, plainText);
            } finally {
                setIsCleaningWord(false);
            }
        } else if (htmlData) {
            e.preventDefault();
            const cleanHtml = sanitizeHtml(htmlData);
            document.execCommand("insertHTML", false, cleanHtml);
            if (editorRef.current) {
                onChange(editorRef.current.innerHTML);
            }
        }
    };

    const escapedSelectorId = targetId.replace(/:/g, "\\:");

    return (
        <div className="flex flex-col w-full rounded-xl border border-border shadow-sm focus-within:ring-1 focus-within:ring-ring focus-within:border-ring bg-background relative z-10 focus-within:z-20">
            <RichTextToolbar
                targetId={targetId}
                value={value}
                onChange={onChange}
            />

            <style dangerouslySetInnerHTML={{
                __html: `
                #${escapedSelectorId}:empty:before {
                    content: attr(placeholder);
                    color: rgb(156 163 175 / 0.6);
                    pointer-events: none;
                    display: block;
                }
                #${escapedSelectorId} * {
                    background-color: transparent !important;
                    color: inherit !important;
                }
            `}} />

            {isCleaningWord && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full shadow-sm animate-pulse border border-blue-200">
                        Đang xử lý nội dung từ MS Word...
                    </span>
                </div>
            )}

            <div
                id={targetId}
                ref={editorRef}
                contentEditable={!disabled}
                onInput={handleInput}
                onPaste={handleLocalPaste}
                onBlur={() => setTimeout(() => setShowMathSuggest(false), 200)}
                placeholder={placeholder}
                className={`w-full border-0 rounded-t-none rounded-b-xl focus-visible:ring-0 outline-none shadow-none px-4 py-3 font-question-text font-medium overflow-y-auto bg-slate-50/40 dark:bg-slate-950/20 hover:bg-slate-50/60 dark:hover:bg-slate-950/30 focus:bg-background dark:focus:bg-background/80 text-foreground transition-colors duration-150 ${className}`}
                style={{ minHeight: `${rows * 28}px` }}
            />

            {/* Math Formula Autocomplete Popover */}
            {showMathSuggest && (
                <div 
                    className="absolute z-50 bg-background border border-border shadow-lg rounded-lg p-1.5 w-64 max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
                    style={{ top: mathSuggestPos.top, left: mathSuggestPos.left }}
                >
                    <div className="px-2 py-1.5 border-b mb-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Gợi ý Công thức</span>
                    </div>
                    {MATH_SUGGESTIONS.map((item, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleMathSelect(item.latex);
                            }}
                            className="w-full flex items-center justify-between text-left px-2 py-1.5 text-xs hover:bg-muted rounded-md transition-colors"
                        >
                            <span className="font-medium text-foreground">{item.label}</span>
                            <span className="font-mono text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded border">{item.latex}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
