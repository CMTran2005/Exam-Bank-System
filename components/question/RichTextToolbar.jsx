/**
 * @file RichTextToolbar.jsx
 * @description Thanh công cụ tùy chỉnh (Toolbar) tích hợp OCR dành cho các ô nhập liệu dạng Rich Input/TextArea.
 * Hỗ trợ định dạng in đậm, in nghiêng, gạch chân, gạch ngang, chèn công thức Toán học/LaTeX, và dán ảnh quét chữ bằng AI.
 */

"use client";

import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Sparkles,
    Sigma,
    Loader2,
    Check,
    HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRichTextToolbar } from "@/hooks/useRichTextToolbar";

const FORMULA_CATEGORIES = {
    math: {
        label: "Phép tính & Đại số",
        items: [
            { label: "Phân số", latex: "\\frac{a}{b}", desc: "Phân số đứng" },
            { label: "Căn bậc 2", latex: "\\sqrt{x}", desc: "Căn bậc hai" },
            { label: "Căn bậc n", latex: "\\sqrt[n]{x}", desc: "Căn bậc n" },
            { label: "Số mũ", latex: "x^y", desc: "Mũ / Lũy thừa" },
            { label: "Chỉ số dưới", latex: "x_{i}", desc: "Chỉ số chân" },
            { label: "Nhân", latex: "\\times", desc: "Dấu nhân" },
            { label: "Chia", latex: "\\div", desc: "Dấu chia" },
            { label: "Cộng trừ", latex: "\\pm", desc: "Cộng hoặc trừ" },
            { label: "Vô cùng", latex: "\\infty", desc: "Vô hạn" },
            { label: "Hàm số", latex: "f(x)", desc: "Ký hiệu hàm" }
        ]
    },
    calculus: {
        label: "Giải tích & Lượng giác",
        items: [
            { label: "Tích phân", latex: "\\int_{a}^{b} x \\,dx", desc: "Tích phân xác định" },
            { label: "Đạo hàm", latex: "y'", desc: "Đạo hàm bậc một" },
            { label: "Tổng", latex: "\\sum_{i=1}^{n}", desc: "Tổng xích ma" },
            { label: "Giới hạn", latex: "\\lim_{x \\to x_0}", desc: "Giới hạn" },
            { label: "Vector", latex: "\\vec{a}", desc: "Vector lượng" },
            { label: "Góc", latex: "\\widehat{A}", desc: "Ký hiệu góc" },
            { label: "Độ", latex: "^{\\circ}", desc: "Độ góc/nhiệt độ" },
            { label: "Sin", latex: "\\sin(x)", desc: "Hàm sin" },
            { label: "Cos", latex: "\\cos(x)", desc: "Hàm cos" },
            { label: "Tan", latex: "\\tan(x)", desc: "Hàm tan" }
        ]
    },
    relations: {
        label: "Quan hệ & Tập hợp",
        items: [
            { label: "Lớn hơn bằng", latex: "\\ge", desc: "Lớn hơn hoặc bằng" },
            { label: "Nhỏ hơn bằng", latex: "\\le", desc: "Nhỏ hơn hoặc bằng" },
            { label: "Khác", latex: "\\ne", desc: "Không bằng" },
            { label: "Xấp xỉ", latex: "\\approx", desc: "Gần bằng" },
            { label: "Thuộc", latex: "\\in", desc: "Phần tử thuộc tập" },
            { label: "Không thuộc", latex: "\\notin", desc: "Không thuộc tập" },
            { label: "Tập con", latex: "\\subset", desc: "Tập con" },
            { label: "Hợp", latex: "\\cup", desc: "Phép hợp" },
            { label: "Giao", latex: "\\cap", desc: "Phép giao" },
            { label: "Tương đương", latex: "\\Leftrightarrow", desc: "Mũi tên tương đương" },
            { label: "Suy ra", latex: "\\Rightarrow", desc: "Mũi tên suy ra" }
        ]
    },
    science: {
        label: "Lý, Hóa & Hy Lạp",
        items: [
            { label: "Phản ứng", latex: "\\rightarrow", desc: "Mũi tên phản ứng" },
            { label: "Thuận nghịch", latex: "\\rightleftharpoons", desc: "Cân bằng hóa học" },
            { label: "Pi", latex: "\\pi", desc: "Ký tự Pi" },
            { label: "Delta", latex: "\\Delta", desc: "Ký tự Delta" },
            { label: "Omega", latex: "\\Omega", desc: "Ký tự ôm (điện trở)" },
            { label: "Alpha", latex: "\\alpha", desc: "Ký tự alpha" },
            { label: "Beta", latex: "\\beta", desc: "Ký tự beta" },
            { label: "Lambda", latex: "\\lambda", desc: "Bước sóng" },
            { label: "Mật độ", latex: "\\rho", desc: "Khối lượng riêng" },
            { label: "Độ C", latex: "^{\\circ}\\text{C}", desc: "Độ C" }
        ]
    }
};

export default function RichTextToolbar({ targetId, value, onChange }) {
    const {
        showLatex, setShowLatex,
        activeCategory, setActiveCategory,
        ocrLoading, fileInputRef,
        activeStates, applyFormat, handleInsert, handleFileChange
    } = useRichTextToolbar(targetId, value, onChange);

    return (
        <div className="flex flex-col border border-border/80 bg-muted/30 dark:bg-muted/10 rounded-t-xl overflow-hidden transition-all select-none">
            <div className="flex flex-wrap items-center justify-between p-1.5 gap-1.5 border-b border-border/60 bg-slate-50 dark:bg-slate-950/60 overflow-x-auto scrollbar-none">
                <div className="flex items-center gap-0.5">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 rounded-md transition-all ${activeStates.bold
                            ? "bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 font-black border border-blue-300/40"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                            }`}
                        onClick={() => applyFormat("bold")}
                        title="Đậm"
                    >
                        <Bold className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 rounded-md transition-all ${activeStates.italic
                            ? "bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 font-black border border-blue-300/40"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                            }`}
                        onClick={() => applyFormat("italic")}
                        title="Nghiêng"
                    >
                        <Italic className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 rounded-md transition-all ${activeStates.underline
                            ? "bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 font-black border border-blue-300/40"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                            }`}
                        onClick={() => applyFormat("underline")}
                        title="Gạch chân"
                    >
                        <Underline className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 rounded-md transition-all ${activeStates.strikethrough
                            ? "bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 font-black border border-blue-300/40"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                            }`}
                        onClick={() => applyFormat("strikethrough")}
                        title="Gạch ngang"
                    >
                        <Strikethrough className="h-3.5 w-3.5" />
                    </Button>

                    <span className="w-px h-5 bg-border/80 mx-1 shrink-0" />

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 rounded-md transition-all ${activeStates["align-left"]
                            ? "bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 font-black border border-blue-300/40"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                            }`}
                        onClick={() => applyFormat("align-left")}
                        title="Căn lề trái"
                    >
                        <AlignLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 rounded-md transition-all ${activeStates["align-center"]
                            ? "bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 font-black border border-blue-300/40"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                            }`}
                        onClick={() => applyFormat("align-center")}
                        title="Căn giữa"
                    >
                        <AlignCenter className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 rounded-md transition-all ${activeStates["align-right"]
                            ? "bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 font-black border border-blue-300/40"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                            }`}
                        onClick={() => applyFormat("align-right")}
                        title="Căn lề phải"
                    >
                        <AlignRight className="h-3.5 w-3.5" />
                    </Button>
                </div>

                <div className="flex items-center gap-1.5">

                    <Button
                        type="button"
                        variant={showLatex ? "secondary" : "ghost"}
                        size="sm"
                        className={`h-8 text-xs font-bold px-2 rounded-md flex items-center gap-1 ${showLatex
                            ? "bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/60"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                            }`}
                        onClick={() => {
                            setShowLatex(!showLatex);
                        }}
                        title="Mở thư viện Công thức LaTeX và tự động chèn ký hiệu $ $"
                    >
                        <Sigma className="h-3.5 w-3.5 text-blue-500" />
                        <span>Chèn công thức</span>
                    </Button>

                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        disabled={ocrLoading}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={ocrLoading}
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8 text-[11px] font-bold px-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/40 rounded-md flex items-center gap-1 shadow-sm hover:shadow"
                        title="Quét công thức/chữ từ hình ảnh"
                    >
                        {ocrLoading ? (
                            <>
                                <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />
                                <span>Đang quét...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-3.5 w-3.5 text-yellow-500 animate-pulse" />
                                <span>Quét ảnh</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {showLatex && (
                <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 border-b border-border/50 animate-in slide-in-from-top-3 duration-200">
                    <div className="flex gap-1.5 border-b border-border/40 pb-2 mb-2 overflow-x-auto scrollbar-none">
                        {Object.entries(FORMULA_CATEGORIES).map(([key, cat]) => (
                            <button
                                key={key}
                                type="button"
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-all whitespace-nowrap ${activeCategory === key
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                                    }`}
                                onClick={() => setActiveCategory(key)}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {FORMULA_CATEGORIES[activeCategory].items.map((item, idx) => (
                            <button
                                key={idx}
                                type="button"
                                className="group flex flex-col justify-between items-center p-2 rounded-lg border border-border/80 bg-background hover:bg-blue-50/40 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-900 transition-all text-center h-16 relative"
                                onClick={() => handleInsert(`$${item.latex}$`)}
                                title={`Nhấp để chèn: ${item.desc}`}
                            >
                                <span className="font-mono text-xs font-black text-foreground truncate max-w-full block py-0.5">
                                    {item.latex}
                                </span>
                                <span className="text-[9px] text-muted-foreground group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors font-medium">
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-muted-foreground font-medium bg-muted/40 p-1.5 rounded-md w-fit">
                        <HelpCircle className="w-3 h-3 text-blue-500" />
                        <span>Công thức LaTeX tự động bao bọc bằng ký tự <b>$</b> để kích hoạt chế độ hiển thị toán học Word.</span>
                    </div>
                </div>
            )}
        </div>
    );
}
