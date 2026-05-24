import { Paintbrush, Laptop } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DisplayTab({
    theme, setTheme, fontSize, setFontSize, latexMode, setLatexMode
}) {
    return (
        <div className="space-y-4">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider pb-2 border-b border-border/60 flex items-center gap-2">
                <Paintbrush className="w-4 h-4 text-primary" />
                Cấu hình hiển thị đề thi & Giao diện
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Chế độ giao diện (Theme)</label>
                    <Select value={theme} onValueChange={setTheme}>
                        <SelectTrigger className="h-10 border-border bg-background">
                            <SelectValue placeholder="Chọn giao diện" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="system">Theo hệ thống / thiết bị (System Theme)</SelectItem>
                            <SelectItem value="light">Giao diện Sáng (Light Theme)</SelectItem>
                            <SelectItem value="dark">Giao diện Tối (Dark Theme)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Cỡ chữ hiển thị đề thi</label>
                    <Select value={fontSize} onValueChange={setFontSize}>
                        <SelectTrigger className="h-10 border-border bg-background">
                            <SelectValue placeholder="Chọn cỡ chữ" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="13">Nhỏ (13px - Tiết kiệm không gian)</SelectItem>
                            <SelectItem value="14">Vừa phải (14px - Dễ đọc nhất)</SelectItem>
                            <SelectItem value="16">Lớn (16px - Trực quan rõ nét)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Chế độ hiển thị công thức LaTeX</label>
                <Select value={latexMode} onValueChange={setLatexMode}>
                    <SelectTrigger className="h-10 border-border bg-background">
                        <SelectValue placeholder="Chọn kiểu hiển thị" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="inline">Nằm cùng hàng văn bản (Inline Mode)</SelectItem>
                        <SelectItem value="block">Xuống dòng canh giữa công thức (Block Mode)</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">Thay đổi cấu trúc căn chỉnh vị trí hiển thị toán học khi duyệt ngân hàng câu hỏi.</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                <p className="text-[11px] font-bold text-foreground flex items-center gap-1">
                    <Laptop className="w-3.5 h-3.5 text-primary" />
                    Xem trước hiển thị trực quan (Preview LaTeX):
                </p>
                <div className="p-3 rounded-lg border border-border bg-background text-center text-xs font-medium space-y-1.5">
                    <p>Đề cương kiểm tra chương lượng tử ánh sáng:</p>
                    <p className="text-primary font-bold">
                        {latexMode === "inline" ? (
                            <span>{"Công thức Năng lượng photon: $E = h \\cdot f = \\frac{h \\cdot c}{\\lambda}$ ($E$ đo bằng Joule)."}</span>
                        ) : (
                            <span className="block space-y-1 text-center">
                                <span>Năng lượng photon:</span>
                                <span className="block py-1 text-base">{"$E = h \\cdot f = \\frac{h \\cdot c}{\\lambda}$"}</span>
                            </span>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}
