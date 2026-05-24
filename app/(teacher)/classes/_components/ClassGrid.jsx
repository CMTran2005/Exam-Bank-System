import Link from "next/link";
import { Copy, QrCode, RefreshCw, Users, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ClassGrid({ filteredClasses, handleDeleteClass, setQrModalCode, handleRefreshCode }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredClasses.map((cls) => (
                <div 
                    key={cls.id} 
                    className="group flex flex-col bg-card rounded-2xl border border-border hover:border-blue-500/40 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                >
                    <div className={`h-2 w-full ${cls.color}`}></div>
                    <div className="px-5 py-4 border-b border-border/40 flex justify-between items-start bg-slate-50/50 dark:bg-slate-900/20">
                        <div>
                            <h3 className="font-bold text-foreground text-lg leading-tight truncate">{cls.name}</h3>
                            <p className="text-xs font-semibold text-muted-foreground mt-1">{cls.grade} • {cls.subject}</p>
                            {cls.startTime && cls.endTime && (
                                <p className="text-[11px] font-medium text-slate-500 mt-1">
                                    {new Date(cls.startTime).toLocaleDateString('vi-VN')} {new Date(cls.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(cls.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ({cls.duration || 0} phút)
                                </p>
                            )}
                        </div>
                        <Button 
                            variant="ghost" size="icon" 
                            className="h-8 w-8 text-muted-foreground -mr-2 hover:bg-red-50 hover:text-red-500"
                            onClick={() => handleDeleteClass(cls.id)}
                            title="Xóa lớp thi"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-4 bg-muted/40 p-3 rounded-xl border border-border/50 relative group">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Mã Lớp Thi</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-lg font-black tracking-widest text-foreground">{cls.classCode}</span>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <Button 
                                    variant="outline" size="icon" 
                                    className="h-7 w-7 rounded-lg text-slate-500 hover:text-slate-900"
                                    onClick={() => { navigator.clipboard.writeText(cls.classCode); toast.success("Đã sao chép mã lớp!"); }}
                                    title="Sao chép"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                </Button>
                                <Button 
                                    variant="outline" size="icon" 
                                    className="h-7 w-7 rounded-lg text-slate-500 hover:text-slate-900"
                                    onClick={() => setQrModalCode(cls.classCode)}
                                    title="Mã QR"
                                >
                                    <QrCode className="w-3.5 h-3.5" />
                                </Button>
                                <Button 
                                    variant="outline" size="icon" 
                                    className="h-7 w-7 rounded-lg text-slate-500 hover:text-slate-900"
                                    onClick={() => handleRefreshCode(cls.id)}
                                    title="Làm mới mã"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mb-4 mt-auto">
                            <div className="flex -space-x-2">
                                {Array.from({ length: Math.min(cls.studentCount || 0, 3) }).map((_, i) => (
                                    <div key={i} className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-card flex items-center justify-center text-[10px] font-bold text-slate-500">HS</div>
                                ))}
                                {(cls.studentCount || 0) > 3 && (
                                    <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 border-2 border-card flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                        +{(cls.studentCount || 0) - 3}
                                    </div>
                                )}
                                {(cls.studentCount || 0) === 0 && (
                                    <span className="text-xs text-muted-foreground italic ml-1">Chưa có học sinh</span>
                                )}
                            </div>
                            {(cls.studentCount || 0) > 0 && (
                                <span className="text-xs font-semibold text-muted-foreground ml-2">
                                    {cls.studentCount} Học sinh
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border/60">
                            <Link href={`/classes/${cls.id}`} className="w-full">
                                <Button variant="outline" className="w-full text-xs font-semibold h-9 rounded-xl border-border hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-950/30 transition-all gap-1.5">
                                    <Users className="w-3.5 h-3.5" /> Danh sách
                                </Button>
                            </Link>
                            <Link href={`/classes/${cls.id}/settings`} className="w-full">
                                <Button className="w-full text-xs font-semibold h-9 rounded-xl gap-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 shadow-sm">
                                    <Settings className="w-3.5 h-3.5" /> Cài đặt
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
