import React from "react";
import { Cpu, CheckCircle2 } from "lucide-react";

/**
 * Component TeacherStatsCards
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @param {Object}  stats  - Tham số đầu vào
 * @returns {JSX.Element}
 */
export default function TeacherStatsCards({ stats }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat) => (
                <div key={stat.label} className="bg-card hover:bg-card/85 transition-colors border border-border shadow-sm rounded-2xl p-5 flex flex-col justify-between space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                            <Cpu className="w-4 h-4" />
                        </span>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-foreground tracking-tight">{stat.value}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 flex items-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1 shrink-0" />
                            {stat.change}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
