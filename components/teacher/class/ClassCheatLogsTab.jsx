import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export function ClassCheatLogsTab({ attempts }) {
    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <h3 className="font-bold text-lg text-red-500 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> Hệ thống giám sát gian lận
                </h3>
            </div>
            <div className="overflow-x-auto border border-border/60 rounded-xl">
                <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-muted/50 text-muted-foreground font-semibold uppercase text-[11px] tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Thí sinh</th>
                            <th className="px-6 py-4 text-center">Chuyển Tab / Mất Focus</th>
                            <th className="px-6 py-4 text-center">Dùng phím tắt cấm</th>
                            <th className="px-6 py-4 text-center">Tiện ích (Extension)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                        {attempts.filter(a => (a.tabSwitchCount > 0) || (a.shortcutCheatCount > 0) || (a.extensionCheatCount > 0) || (a.otherCheatCount > 0) || (a.cheatLogs && a.cheatLogs.length > 0)).length > 0 ? (
                            attempts.filter(a => (a.tabSwitchCount > 0) || (a.shortcutCheatCount > 0) || (a.extensionCheatCount > 0) || (a.otherCheatCount > 0) || (a.cheatLogs && a.cheatLogs.length > 0)).map(a => (
                                <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-6 py-4 font-bold text-foreground">
                                        {a.studentName}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {a.tabSwitchCount > 0 ? (
                                            <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full font-black text-xs">{a.tabSwitchCount} lần</span>
                                        ) : <span className="text-muted-foreground/50">-</span>}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {a.shortcutCheatCount > 0 ? (
                                            <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full font-black text-xs">{a.shortcutCheatCount} lần</span>
                                        ) : <span className="text-muted-foreground/50">-</span>}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {a.extensionCheatCount > 0 ? (
                                            <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full font-black text-xs">{a.extensionCheatCount} lần</span>
                                        ) : <span className="text-muted-foreground/50">-</span>}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" className="px-6 py-12 text-center">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mx-auto mb-3" />
                                    <p className="font-semibold text-foreground">Không phát hiện gian lận nào</p>
                                    <p className="text-xs text-muted-foreground mt-1">Tất cả thí sinh đều đang tuân thủ quy chế thi.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
