import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from "recharts";
import { Target, TrendingUp } from "lucide-react";

/**
 * Component StudentCharts
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @param {Object}  radarData - Tham số đầu vào
 * @returns {JSX.Element}
 */
export default function StudentCharts({ radarData, trendData }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Biểu đồ Phổ điểm */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                <h3 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" /> Điểm Trung Bình Từng Môn
                </h3>
                <div className="h-[300px] w-full min-w-0" style={{ position: 'relative' }}>
                    {radarData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300} minWidth={1} minHeight={1}>
                            <BarChart data={radarData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 12, fontWeight: "bold" }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 10]} tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                                />
                                <Bar dataKey="score" name="Điểm TB" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                    {radarData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.subject === "Tự do" ? "#10b981" : "#0ea5e9"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Chưa có đủ dữ liệu môn học</div>
                    )}
                </div>
            </div>

            {/* Biểu đồ Tiến độ */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                <h3 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500" /> Tần Suất Học Tập (Gần Đây)
                </h3>
                <div className="h-[300px] w-full min-w-0" style={{ position: 'relative' }}>
                    {trendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300} minWidth={1} minHeight={1}>
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                                <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                                />
                                <Area connectNulls={true} type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" name="Số bài làm" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Chưa có đủ dữ liệu tiến độ</div>
                    )}
                </div>
            </div>
        </div>
    );
}
