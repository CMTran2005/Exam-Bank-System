import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Component CustomDatePicker
 * Xử lý logic và chức năng liên quan.
 *
 * @param {any}  value - Tham số đầu vào
 * @returns {JSX.Element}
 */
export function CustomDatePicker({ value, onChange, isOpen, onToggle }) {
    const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const handlePrevMonth = (e) => {
        e.stopPropagation();
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = (e) => {
        e.stopPropagation();
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleSelectDate = (day, e) => {
        e.stopPropagation();
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        // Format as YYYY-MM-DD
        const formatted = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`;
        onChange(formatted);
        onToggle();
    };

    const displayValue = value ? new Date(value).toLocaleDateString("vi-VN") : "Chọn ngày";

    return (
        <div className="relative w-full">
            <Button
                type="button"
                variant="outline"
                className="w-full h-11 rounded-xl justify-between px-3 font-normal"
                onClick={onToggle}
            >
                <span className="flex items-center gap-2 truncate">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                    {displayValue}
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            </Button>
            
            {isOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-[280px] bg-background border border-border rounded-xl shadow-lg z-50 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-3">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-bold">
                            Tháng {currentMonth.getMonth() + 1} / {currentMonth.getFullYear()}
                        </span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
                            <div key={d} className="text-[10px] font-bold text-muted-foreground py-1">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, idx) => {
                            if (!day) return <div key={`empty-${idx}`} className="h-8 w-8" />;
                            
                            const isSelected = value && 
                                new Date(value).getDate() === day && 
                                new Date(value).getMonth() === currentMonth.getMonth() &&
                                new Date(value).getFullYear() === currentMonth.getFullYear();
                                
                            const isToday = new Date().getDate() === day && 
                                new Date().getMonth() === currentMonth.getMonth() &&
                                new Date().getFullYear() === currentMonth.getFullYear();

                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={(e) => handleSelectDate(day, e)}
                                    className={`h-8 w-8 rounded-lg text-sm flex items-center justify-center transition-colors ${
                                        isSelected 
                                            ? "bg-blue-600 text-white font-bold" 
                                            : isToday 
                                                ? "bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50" 
                                                : "hover:bg-muted text-foreground"
                                    }`}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Component CustomTimePicker
 * Xử lý logic và chức năng liên quan.
 *
 * @param {any}  value - Tham số đầu vào
 * @returns {JSX.Element}
 */
export function CustomTimePicker({ value, onChange, isOpen, onToggle }) {
    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const minutes = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

    const currentHour = value ? value.split(':')[0] : "07";
    const currentMinute = value ? value.split(':')[1] : "00";

    const handleHourChange = (h) => {
        onChange(`${h}:${currentMinute}`);
    };

    const handleMinuteChange = (m) => {
        onChange(`${currentHour}:${m}`);
    };

    const displayValue = value || "Chọn giờ";

    return (
        <div className="relative w-full">
            <Button
                type="button"
                variant="outline"
                className="w-full h-11 rounded-xl justify-between px-3 font-normal"
                onClick={onToggle}
            >
                <span className="flex items-center gap-2 truncate">
                    <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-foreground">{displayValue}</span>
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </Button>

            {isOpen && (
                <div className="absolute top-full left-0 w-[240px] mt-1.5 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex h-52">
                        {/* Hours Column */}
                        <div className="flex-1 overflow-y-auto border-r border-border/50 p-1">
                            <div className="sticky top-0 bg-background/95 backdrop-blur text-center text-[10px] font-bold text-muted-foreground pb-1.5 pt-1 z-10 border-b border-border/50">GIỜ</div>
                            <div className="pt-1 pb-4">
                                {hours.map(h => (
                                    <div
                                        key={`h-${h}`}
                                        onClick={(e) => { e.stopPropagation(); handleHourChange(h); }}
                                        className={`py-2 text-center text-sm cursor-pointer rounded-lg transition-colors mx-1 ${
                                            h === currentHour ? 'bg-blue-600 text-white font-bold shadow-md' : 'hover:bg-muted text-foreground'
                                        }`}
                                    >
                                        {h}
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Minutes Column */}
                        <div className="flex-1 overflow-y-auto p-1">
                            <div className="sticky top-0 bg-background/95 backdrop-blur text-center text-[10px] font-bold text-muted-foreground pb-1.5 pt-1 z-10 border-b border-border/50">PHÚT</div>
                            <div className="pt-1 pb-4">
                                {minutes.map(m => (
                                    <div
                                        key={`m-${m}`}
                                        onClick={(e) => { e.stopPropagation(); handleMinuteChange(m); }}
                                        className={`py-2 text-center text-sm cursor-pointer rounded-lg transition-colors mx-1 ${
                                            m === currentMinute ? 'bg-blue-600 text-white font-bold shadow-md' : 'hover:bg-muted text-foreground'
                                        }`}
                                    >
                                        {m}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="p-2 border-t border-border bg-muted/30">
                        <Button 
                            variant="default" 
                            className="w-full h-9 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={(e) => { e.stopPropagation(); onToggle(); }}
                        >
                            Xác nhận
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
