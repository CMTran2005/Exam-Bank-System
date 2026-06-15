import { Award, Activity, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ChildCard({ child, router, onEncourage }) {
    return (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <div className="bg-gradient-to-r from-sky-500 to-indigo-500 h-24 relative">
                <div className="absolute -bottom-10 left-6">
                    <div className="w-20 h-20 rounded-full border-4 border-card shadow-lg bg-sky-50 overflow-hidden flex items-center justify-center text-2xl font-black text-sky-600">
                        {child.photoURL ? (
                            <img src={child.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            child.name?.charAt(0) || "H"
                        )}
                    </div>
                </div>
            </div>
            
            <div className="pt-12 pb-6 px-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-black text-foreground">{child.name}</h3>
                        <p className="text-xs text-muted-foreground font-medium">{child.email}</p>
                    </div>
                    <span className="bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 text-xs font-bold px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800">
                        {child.grade ? `Lớp ${child.grade}` : "Chưa cập nhật lớp"}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Award className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-bold uppercase">Điểm Trung Bình</span>
                        </div>
                        <p className="text-2xl font-black text-foreground">{child.avgScore} <span className="text-sm font-medium text-muted-foreground/70">/10</span></p>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Activity className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-bold uppercase">Bài Thi Đã Làm</span>
                        </div>
                        <p className="text-2xl font-black text-foreground">{child.examsTaken} <span className="text-sm font-medium text-muted-foreground/70">đề thi</span></p>
                    </div>
                </div>

                <div className="flex gap-3 mt-2">
                    <Button 
                        onClick={() => router.push(`/parent/student/${child.id}`)}
                        className="flex-1 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900"
                    >
                        Báo Cáo
                    </Button>
                    <Button 
                        onClick={() => onEncourage(child)}
                        variant="outline"
                        className="flex-1 rounded-xl font-bold border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                    >
                        <Heart className="w-4 h-4 mr-2" /> Động Viên
                    </Button>
                </div>
            </div>
        </div>
    );
}
