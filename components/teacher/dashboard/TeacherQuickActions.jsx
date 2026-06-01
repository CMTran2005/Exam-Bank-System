import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

/**
 * Component TeacherQuickActions
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @param {Object}  quickActions  - Tham số đầu vào
 * @returns {JSX.Element}
 */
export default function TeacherQuickActions({ quickActions }) {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                <span className="w-2.5 h-5 bg-primary rounded-full" />
                Hành Động Nhanh
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {quickActions.map((action) => (
                    <div key={action.title} className="bg-card hover:bg-card/80 transition-all duration-300 border border-border/80 rounded-2xl p-5 flex flex-col justify-between hover:shadow-lg shadow-sm group">
                        <div className="space-y-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} text-white flex items-center justify-center shadow-md`}>
                                <action.icon className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{action.title}</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">{action.desc}</p>
                        </div>
                        <Link href={action.href} className="mt-5">
                            <Button variant="outline" size="sm" className="w-full text-xs font-semibold rounded-lg hover:bg-primary hover:text-primary-foreground">
                                {action.btnText}
                                <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
