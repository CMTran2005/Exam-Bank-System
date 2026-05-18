/**
 * @file RichTextarea.jsx
 * @description Hộp nhập liệu nội dung lớn (Textarea) có định dạng và tích hợp thanh công cụ OCR.
 * Sử dụng thuộc tính contentEditable của HTML5 để hỗ trợ hiển thị thẻ HTML trực quan (Bold, Italic, Latex, v.v.).
 */

"use client";

import { useId, useRef, useEffect } from "react";
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

    // Đồng bộ giá trị từ component cha vào innerHTML của div contentEditable khi value thay đổi
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || "";
        }
    }, [value]);

    // Xử lý sự kiện nhập liệu trực tiếp và truyền nội dung HTML lên component cha
    const handleInput = (e) => {
        if (onChange) {
            onChange(e.target.innerHTML);
        }
    };

    const escapedSelectorId = targetId.replace(/:/g, "\\:");

    return (
        <div className="flex flex-col w-full rounded-xl border border-border shadow-sm focus-within:ring-1 focus-within:ring-ring focus-within:border-ring overflow-hidden bg-background">
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
            `}} />

            <div
                id={targetId}
                ref={editorRef}
                contentEditable={!disabled}
                onInput={handleInput}
                onPaste={onPaste}
                placeholder={placeholder}
                className={`w-full border-0 rounded-t-none rounded-b-xl focus-visible:ring-0 outline-none shadow-none px-4 py-3 font-medium overflow-y-auto bg-slate-50/40 dark:bg-slate-950/20 hover:bg-slate-50/60 dark:hover:bg-slate-950/30 focus:bg-background dark:focus:bg-background/80 transition-colors duration-150 ${className}`}
                style={{ minHeight: `${rows * 28}px` }}
            />
        </div>
    );
}
