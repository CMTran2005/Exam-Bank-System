"use client";

import { ListChecks, Layers, ToggleLeft, GitBranch, FileText, FilePlus2, X, TextCursorInput, Type, Link, ListOrdered } from "lucide-react";

const TYPES = [
    {
        value: "multiple_choice",
        label: "Trắc nghiệm",
        sub: "Đơn",
        Icon: ListChecks,
        bg: "bg-blue-50 dark:bg-blue-950/40",
        border: "border-blue-300 dark:border-blue-700",
        text: "text-blue-700 dark:text-blue-300",
        hover: "hover:bg-blue-100 dark:hover:bg-blue-900/50",
        iconColor: "text-blue-500 dark:text-blue-400",
    },
    {
        value: "group_multiple_choice",
        label: "Trắc nghiệm",
        sub: "Nhóm",
        Icon: Layers,
        bg: "bg-violet-50 dark:bg-violet-950/40",
        border: "border-violet-300 dark:border-violet-700",
        text: "text-violet-700 dark:text-violet-300",
        hover: "hover:bg-violet-100 dark:hover:bg-violet-900/50",
        iconColor: "text-violet-500 dark:text-violet-400",
    },
    {
        value: "true_false",
        label: "Đúng / Sai",
        sub: "Đơn",
        Icon: ToggleLeft,
        bg: "bg-emerald-50 dark:bg-emerald-950/40",
        border: "border-emerald-300 dark:border-emerald-700",
        text: "text-emerald-700 dark:text-emerald-300",
        hover: "hover:bg-emerald-100 dark:hover:bg-emerald-900/50",
        iconColor: "text-emerald-500 dark:text-emerald-400",
    },
    {
        value: "group_true_false",
        label: "Đúng / Sai",
        sub: "Nhóm",
        Icon: GitBranch,
        bg: "bg-teal-50 dark:bg-teal-950/40",
        border: "border-teal-300 dark:border-teal-700",
        text: "text-teal-700 dark:text-teal-300",
        hover: "hover:bg-teal-100 dark:hover:bg-teal-900/50",
        iconColor: "text-teal-500 dark:text-teal-400",
    },
    {
        value: "essay",
        label: "Tự luận",
        sub: "Đơn",
        Icon: FileText,
        bg: "bg-amber-50 dark:bg-amber-950/40",
        border: "border-amber-300 dark:border-amber-700",
        text: "text-amber-700 dark:text-amber-300",
        hover: "hover:bg-amber-100 dark:hover:bg-amber-900/50",
        iconColor: "text-amber-500 dark:text-amber-400",
    },
    {
        value: "group_essay",
        label: "Tự luận",
        sub: "Nhóm",
        Icon: FilePlus2,
        bg: "bg-orange-50 dark:bg-orange-950/40",
        border: "border-orange-300 dark:border-orange-700",
        text: "text-orange-700 dark:text-orange-300",
        hover: "hover:bg-orange-100 dark:hover:bg-orange-900/50",
        iconColor: "text-orange-500 dark:text-orange-400",
    },
    {
        value: "fill_blank",
        label: "Điền khuyết",
        sub: "Đơn",
        Icon: TextCursorInput,
        bg: "bg-pink-50 dark:bg-pink-950/40",
        border: "border-pink-300 dark:border-pink-700",
        text: "text-pink-700 dark:text-pink-300",
        hover: "hover:bg-pink-100 dark:hover:bg-pink-900/50",
        iconColor: "text-pink-500 dark:text-pink-400",
    },
    {
        value: "group_fill_blank",
        label: "Điền khuyết",
        sub: "Nhóm",
        Icon: Type,
        bg: "bg-fuchsia-50 dark:bg-fuchsia-950/40",
        border: "border-fuchsia-300 dark:border-fuchsia-700",
        text: "text-fuchsia-700 dark:text-fuchsia-300",
        hover: "hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/50",
        iconColor: "text-fuchsia-500 dark:text-fuchsia-400",
    },
    {
        value: "matching",
        label: "Nối từ",
        sub: "Đơn",
        Icon: Link,
        bg: "bg-cyan-50 dark:bg-cyan-950/40",
        border: "border-cyan-300 dark:border-cyan-700",
        text: "text-cyan-700 dark:text-cyan-300",
        hover: "hover:bg-cyan-100 dark:hover:bg-cyan-900/50",
        iconColor: "text-cyan-500 dark:text-cyan-400",
    },
    {
        value: "group_matching",
        label: "Nối từ",
        sub: "Nhóm",
        Icon: Link,
        bg: "bg-sky-50 dark:bg-sky-950/40",
        border: "border-sky-300 dark:border-sky-700",
        text: "text-sky-700 dark:text-sky-300",
        hover: "hover:bg-sky-100 dark:hover:bg-sky-900/50",
        iconColor: "text-sky-500 dark:text-sky-400",
    },
    {
        value: "ordering",
        label: "Sắp xếp",
        sub: "Đơn",
        Icon: ListOrdered,
        bg: "bg-indigo-50 dark:bg-indigo-950/40",
        border: "border-indigo-300 dark:border-indigo-700",
        text: "text-indigo-700 dark:text-indigo-300",
        hover: "hover:bg-indigo-100 dark:hover:bg-indigo-900/50",
        iconColor: "text-indigo-500 dark:text-indigo-400",
    },
    {
        value: "group_ordering",
        label: "Sắp xếp",
        sub: "Nhóm",
        Icon: ListOrdered,
        bg: "bg-rose-50 dark:bg-rose-950/40",
        border: "border-rose-300 dark:border-rose-700",
        text: "text-rose-700 dark:text-rose-300",
        hover: "hover:bg-rose-100 dark:hover:bg-rose-900/50",
        iconColor: "text-rose-500 dark:text-rose-400",
    }
];

/**
 * Component QuestionTypePicker
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @param {Object}  onSelect - Tham số đầu vào
 * @returns {JSX.Element}
 */
export default function QuestionTypePicker({ onSelect, onCancel }) {
    return (
        <div className="border border-dashed border-blue-300 dark:border-blue-800 rounded-xl p-4 bg-blue-50/40 dark:bg-blue-950/10 animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-semibold text-foreground">Chọn dạng câu hỏi:</p>
                <button
                    type="button"
                    onClick={onCancel}
                    className="h-7 w-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Đóng"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {TYPES.map((t) => {
                    const { Icon } = t;
                    return (
                        <button
                            key={t.value}
                            type="button"
                            onClick={() => onSelect(t.value)}
                            className={`
                                flex flex-col items-center justify-center gap-2
                                h-20 rounded-xl border-2 border-dashed cursor-pointer
                                transition-all duration-150 select-none active:scale-95
                                ${t.bg} ${t.border} ${t.hover}
                            `}
                            title={`${t.label} ${t.sub}`}
                        >
                            <Icon className={`w-6 h-6 ${t.iconColor}`} />
                            <span className={`text-[10px] font-semibold text-center leading-tight ${t.text}`}>
                                {t.label}<br />{t.sub}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
