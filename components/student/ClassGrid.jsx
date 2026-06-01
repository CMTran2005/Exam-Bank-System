import React from "react";
import Link from "next/link";
import { BookOpen, BookMarked, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClassGrid({ classes, loading }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <BookMarked className="w-5 h-5 text-primary" />
                    Lớp thi của tôi ({classes.length})
                </h2>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-card rounded-2xl animate-pulse border border-border"></div>
                    ))}
                </div>
            ) : classes.length === 0 ? (
                <div className="text-center py-16 bg-card border border-dashed border-border rounded-3xl">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-bold mb-1">Chưa tham gia lớp nào</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        Hãy xin mã lớp từ giáo viên của bạn và nhập vào ô tìm kiếm phía trên để bắt đầu nhé!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {classes.map((cls) => (
                        <div key={cls.id} className="group bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                            <div className={`h-2.5 w-full ${cls.color || "bg-blue-500"}`}></div>
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{cls.name}</h3>
                                        <p className="text-xs font-semibold text-muted-foreground mt-1">{cls.grade} • {cls.subject}</p>
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/50">
                                    <div className="flex items-center text-xs text-muted-foreground">
                                        <Clock className="w-3.5 h-3.5 mr-1" />
                                        Đã tham gia: {new Date(cls.joinedAt).toLocaleDateString("vi-VN")}
                                    </div>
                                    <Link href={`/student/class/${cls.id}`}>
                                        <Button variant="ghost" size="sm" className="h-8 rounded-lg text-primary hover:bg-primary/10 font-semibold px-3">
                                            Vào lớp <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
