import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export function Switch({ checked, onCheckedChange, disabled }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onCheckedChange?.(!checked)}
            className={`
                relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                ${checked ? 'bg-purple-600' : 'bg-slate-700'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
        >
            <span
                className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                    ${checked ? 'translate-x-5' : 'translate-x-0'}
                `}
            />
        </button>
    );
}

export function CustomSelect({ value, onChange, options, label }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="space-y-1.5 relative text-left" ref={containerRef}>
            <label className="text-xs font-bold text-slate-400">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold flex items-center justify-between focus:outline-none focus:border-purple-500 h-9 transition-all cursor-pointer"
            >
                <span className="truncate pr-1">{selectedOption ? selectedOption.label : "Chọn..."}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute left-0 right-0 mt-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs font-bold transition-colors block cursor-pointer
                                ${opt.value === value
                                    ? 'bg-purple-600 text-white'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }
                            `}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
