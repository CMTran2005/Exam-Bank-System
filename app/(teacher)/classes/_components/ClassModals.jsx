import { X, Calendar, ChevronDown, Loader2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomDatePicker, CustomTimePicker } from "@/components/ui/date-time-picker";

/**
 * Component ClassModals
 * Xử lý logic và chức năng liên quan.
 *
 * @param {any} 
    isCreateModalOpen - Tham số đầu vào
 * @returns {JSX.Element}
 */
export function ClassModals({
    isCreateModalOpen, setIsCreateModalOpen, handleCreateClass, isCreating,
    newClassName, setNewClassName,
    newSchoolYear, setNewSchoolYear, yearsList,
    newGrade, setNewGrade, GRADES,
    newSubject, setNewSubject, gradeSubjectsMap,
    examDate, setExamDate,
    examTime, setExamTime,
    examDuration, setExamDuration,
    activeDropdown, toggleDropdown, setActiveDropdown,
    qrModalCode, setQrModalCode
}) {
    return (
        <>
            {/* Create Class Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between rounded-t-2xl">
                            <h2 className="text-lg font-bold text-foreground">Tạo Lớp Thi Mới</h2>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2" onClick={() => setIsCreateModalOpen(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <form onSubmit={handleCreateClass} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground">Tên lớp thi</label>
                                <Input 
                                    autoFocus
                                    placeholder="Ví dụ: Thi Cuối Kỳ - Toán" 
                                    className="h-11 rounded-xl"
                                    value={newClassName}
                                    onChange={(e) => setNewClassName(e.target.value)}
                                    maxLength={50}
                                    required
                                />
                            </div>
                            <div className="space-y-2 relative">
                                <label className="text-sm font-semibold text-foreground">Năm học</label>
                                <div className="relative">
                                    <Button
                                        type="button" variant="outline"
                                        className="w-full h-11 rounded-xl justify-between px-3 font-normal"
                                        onClick={() => toggleDropdown('year')}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-muted-foreground" /> {newSchoolYear}
                                        </span>
                                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${activeDropdown === 'year' ? "rotate-180" : ""}`} />
                                    </Button>
                                    
                                    {activeDropdown === 'year' && (
                                        <div className="absolute top-full left-0 w-full mt-1.5 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-48 overflow-y-auto">
                                            {yearsList.map((year) => (
                                                <div 
                                                    key={year}
                                                    className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 transition-colors ${newSchoolYear === year ? "bg-blue-50/50 text-blue-600 font-bold dark:bg-blue-900/20" : "text-foreground font-medium"}`}
                                                    onClick={() => { setNewSchoolYear(year); setActiveDropdown(null); }}
                                                >
                                                    {year}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 relative">
                                    <label className="text-sm font-semibold text-foreground">Khối lớp</label>
                                    <div className="relative">
                                        <Button
                                            type="button" variant="outline"
                                            className="w-full h-11 rounded-xl justify-between px-3 font-normal"
                                            onClick={() => toggleDropdown('grade')}
                                        >
                                            <span className="truncate">{newGrade}</span>
                                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${activeDropdown === 'grade' ? "rotate-180" : ""}`} />
                                        </Button>
                                        {activeDropdown === 'grade' && (
                                            <div className="absolute top-full left-0 w-full mt-1.5 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                                {GRADES.map((grade) => (
                                                    <div 
                                                        key={grade}
                                                        className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 transition-colors ${newGrade === grade ? "bg-blue-50/50 text-blue-600 font-bold dark:bg-blue-900/20" : "text-foreground font-medium"}`}
                                                        onClick={() => { setNewGrade(grade); setNewSubject((gradeSubjectsMap[grade] || [])[0] || ""); setActiveDropdown(null); }}
                                                    >
                                                        {grade}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2 relative">
                                    <label className="text-sm font-semibold text-foreground">Môn thi</label>
                                    <div className="relative">
                                        <Button
                                            type="button" variant="outline"
                                            className="w-full h-11 rounded-xl justify-between px-3 font-normal"
                                            onClick={() => toggleDropdown('subject')}
                                        >
                                            <span className="truncate">{newSubject}</span>
                                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${activeDropdown === 'subject' ? "rotate-180" : ""}`} />
                                        </Button>
                                        {activeDropdown === 'subject' && (
                                            <div className="absolute top-full left-0 w-full mt-1.5 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                                {(gradeSubjectsMap[newGrade] || []).map((sub) => (
                                                    <div 
                                                        key={sub}
                                                        className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 transition-colors ${newSubject === sub ? "bg-blue-50/50 text-blue-600 font-bold dark:bg-blue-900/20" : "text-foreground font-medium"}`}
                                                        onClick={() => { setNewSubject(sub); setActiveDropdown(null); }}
                                                    >
                                                        {sub}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground">Ngày thi</label>
                                    <CustomDatePicker 
                                        value={examDate} 
                                        onChange={setExamDate} 
                                        isOpen={activeDropdown === 'date'} 
                                        onToggle={() => toggleDropdown('date')} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground">Giờ bắt đầu</label>
                                    <CustomTimePicker 
                                        value={examTime} 
                                        onChange={setExamTime} 
                                        isOpen={activeDropdown === 'time'} 
                                        onToggle={() => toggleDropdown('time')} 
                                    />
                                </div>
                                <div className="space-y-2 relative">
                                    <label className="text-sm font-semibold text-foreground">Thời lượng</label>
                                    <div className="relative">
                                        <Button
                                            type="button" variant="outline"
                                            className="w-full h-11 rounded-xl justify-between px-3 font-normal"
                                            onClick={() => toggleDropdown('duration')}
                                        >
                                            <span className="truncate">{examDuration} phút</span>
                                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${activeDropdown === 'duration' ? "rotate-180" : ""}`} />
                                        </Button>
                                        {activeDropdown === 'duration' && (
                                            <div className="absolute top-full right-0 min-w-[120px] mt-1.5 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                                {[15, 30, 45, 60, 90, 120, 150, 180].map((mins) => (
                                                    <div 
                                                        key={mins}
                                                        className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 transition-colors ${examDuration === mins ? "bg-blue-50/50 text-blue-600 font-bold dark:bg-blue-900/20" : "text-foreground font-medium"}`}
                                                        onClick={() => { setExamDuration(mins); setActiveDropdown(null); }}
                                                    >
                                                        {mins} phút
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-4 flex items-center justify-end gap-3">
                                <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => setIsCreateModalOpen(false)}>
                                    Hủy bỏ
                                </Button>
                                <Button type="submit" disabled={isCreating || !newClassName.trim()} className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold w-32">
                                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tạo Lớp"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {qrModalCode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 text-center">
                        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <QrCode className="w-5 h-5 text-blue-500" />
                                Mã QR Lớp Thi
                            </h2>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2" onClick={() => setQrModalCode(null)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="p-8 flex flex-col items-center justify-center">
                            <div className="bg-white p-4 rounded-xl shadow-inner border border-slate-100 mb-6">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrModalCode}`} 
                                    alt="Class QR Code" 
                                    className="w-48 h-48"
                                />
                            </div>
                            <p className="text-sm text-muted-foreground font-medium mb-1">Thí sinh quét mã để tham gia thi</p>
                            <span className="font-mono text-3xl font-black tracking-widest text-foreground bg-muted px-4 py-2 rounded-xl mt-2">
                                {qrModalCode}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
