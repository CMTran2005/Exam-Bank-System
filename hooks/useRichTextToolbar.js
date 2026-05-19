import { useState, useRef, useEffect } from "react";

export function useRichTextToolbar(targetId, value, onChange) {
    const [showLatex, setShowLatex] = useState(false);
    const [activeCategory, setActiveCategory] = useState("math");
    const [ocrLoading, setOcrLoading] = useState(false);
    const fileInputRef = useRef(null);

    const [activeStates, setActiveStates] = useState({
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        "align-left": false,
        "align-center": false,
        "align-right": false
    });

    useEffect(() => {
        const checkCommandStates = () => {
            const activeEl = document.activeElement;
            if (activeEl && activeEl.id === targetId) {
                setActiveStates({
                    bold: document.queryCommandState("bold"),
                    italic: document.queryCommandState("italic"),
                    underline: document.queryCommandState("underline"),
                    strikethrough: document.queryCommandState("strikeThrough"),
                    "align-left": document.queryCommandState("justifyLeft"),
                    "align-center": document.queryCommandState("justifyCenter"),
                    "align-right": document.queryCommandState("justifyRight")
                });
            }
        };

        document.addEventListener("selectionchange", checkCommandStates);

        const input = document.getElementById(targetId);
        if (input) {
            input.addEventListener("mouseup", checkCommandStates);
            input.addEventListener("keyup", checkCommandStates);
            input.addEventListener("focus", checkCommandStates);
        }

        return () => {
            document.removeEventListener("selectionchange", checkCommandStates);
            if (input) {
                input.removeEventListener("mouseup", checkCommandStates);
                input.removeEventListener("keyup", checkCommandStates);
                input.removeEventListener("focus", checkCommandStates);
            }
        };
    }, [targetId]);

    const handleInsert = (textToInsert) => {
        const input = document.getElementById(targetId);
        if (!input) {
            onChange(value ? `${value} ${textToInsert}` : textToInsert);
            return;
        }

        input.focus();
        document.execCommand("insertHTML", false, textToInsert);

        setTimeout(() => {
            onChange(input.innerHTML);
        }, 10);
    };

    const applyFormat = (formatType) => {
        const input = document.getElementById(targetId);
        if (!input) return;

        input.focus();

        switch (formatType) {
            case "bold":
                document.execCommand("bold", false, null);
                break;
            case "italic":
                document.execCommand("italic", false, null);
                break;
            case "underline":
                document.execCommand("underline", false, null);
                break;
            case "strikethrough":
                document.execCommand("strikeThrough", false, null);
                break;
            case "align-left":
                document.execCommand("justifyLeft", false, null);
                break;
            case "align-center":
                document.execCommand("justifyCenter", false, null);
                break;
            case "align-right":
                document.execCommand("justifyRight", false, null);
                break;
            default:
                return;
        }

        setActiveStates(prev => {
            const next = { ...prev };
            if (formatType === "bold") next.bold = document.queryCommandState("bold");
            if (formatType === "italic") next.italic = document.queryCommandState("italic");
            if (formatType === "underline") next.underline = document.queryCommandState("underline");
            if (formatType === "strikethrough") next.strikethrough = document.queryCommandState("strikeThrough");
            if (formatType === "align-left") next["align-left"] = document.queryCommandState("justifyLeft");
            if (formatType === "align-center") next["align-center"] = document.queryCommandState("justifyCenter");
            if (formatType === "align-right") next["align-right"] = document.queryCommandState("justifyRight");
            return next;
        });

        setTimeout(() => {
            onChange(input.innerHTML);
        }, 10);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setOcrLoading(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            const base64Image = reader.result;
            try {
                const response = await fetch("/api/ocr", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ image: base64Image }),
                });
                const data = await response.json();

                if (data.error || !data.content || !data.content.trim()) {
                    handleInsert(`<img src="${base64Image}" alt="Ảnh tải lên" style="max-width: 100%; border-radius: 8px; margin: 4px 0; display: block;" />`);
                } else {
                    handleInsert(data.content);
                }
            } catch (err) {
                console.error("Lỗi gọi API dán ảnh, giữ nguyên ảnh gốc:", err);
                handleInsert(`<img src="${base64Image}" alt="Ảnh tải lên" style="max-width: 100%; border-radius: 8px; margin: 4px 0; display: block;" />`);
            } finally {
                setOcrLoading(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        };
    };

    return {
        showLatex, setShowLatex,
        activeCategory, setActiveCategory,
        ocrLoading, fileInputRef,
        activeStates, applyFormat, handleInsert, handleFileChange
    };
}
