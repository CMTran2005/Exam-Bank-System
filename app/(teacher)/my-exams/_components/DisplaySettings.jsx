import { Eye, Check } from "lucide-react";

export function DisplaySettings({ displaySettings, toggleSetting }) {
    return (
        <div className="p-4 bg-muted/40 dark:bg-muted/10 border border-border rounded-2xl animate-in slide-in-from-top-3 duration-250 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <h4 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                    Cấu hình thông tin hiển thị
                </h4>
                <span className="text-[10px] text-muted-foreground font-medium">Thay đổi được tự động lưu lại</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                {[
                    { key: "id", label: "Mã đề thi" },
                    { key: "subject", label: "Môn học" },
                    { key: "grade", label: "Khối lớp" },
                    { key: "province", label: "Tỉnh thành" },
                    { key: "year", label: "Năm học" },
                    { key: "duration", label: "Thời lượng" },
                    { key: "total_questions", label: "Số câu hỏi" },
                    { key: "updatedAt", label: "Cập nhật" },
                ].map((item) => {
                    const isChecked = displaySettings[item.key];
                    return (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => toggleSetting(item.key)}
                            className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${isChecked
                                ? "bg-primary/5 border-primary/30 text-primary font-bold"
                                : "bg-background border-border/80 text-muted-foreground hover:bg-muted/40"
                                }`}
                        >
                            <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${isChecked ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30 bg-transparent"}`}>
                                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="text-xs truncate">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
