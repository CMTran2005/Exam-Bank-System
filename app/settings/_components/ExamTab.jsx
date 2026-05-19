import { FileText, Clock, Shuffle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ExamTab({
    defaultPoints, setDefaultPoints, pointsStep, setPointsStep,
    duration, setDuration, headerTitle, setHeaderTitle,
    autoNumbering, setAutoNumbering, shuffleOptions, setShuffleOptions
}) {
    return (
        <div className="space-y-4">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider pb-2 border-b border-border/60 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Tham số mặc định đề thi
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Điểm mặc định mỗi câu hỏi</label>
                    <Input type="number" step="0.25" value={defaultPoints} onChange={(e) => setDefaultPoints(e.target.value)} className="h-10 border-border" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Bước nhảy tăng điểm (step)</label>
                    <Input type="number" step="0.05" value={pointsStep} onChange={(e) => setPointsStep(e.target.value)} className="h-10 border-border" />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Thời gian làm bài mặc định</label>
                    <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger className="h-10 border-border bg-background">
                            <SelectValue placeholder="Chọn thời gian" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="15">15 phút (Kiểm tra nhanh)</SelectItem>
                            <SelectItem value="45">45 phút (Kiểm tra 1 tiết)</SelectItem>
                            <SelectItem value="60">60 phút (Kiểm tra học kỳ)</SelectItem>
                            <SelectItem value="90">90 phút (Thi thử THPT QG)</SelectItem>
                            <SelectItem value="120">120 phút (Thi chuyên/Đại học)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Tiêu đề đầu trang đề thi mặc định</label>
                    <Input value={headerTitle} onChange={(e) => setHeaderTitle(e.target.value)} className="h-10 border-border" placeholder="ĐỀ KIỂM TRA HỌC KÌ I NĂM HỌC" />
                </div>
            </div>

            <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
                    <div className="pr-4">
                        <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            Tự động điền ký hiệu số câu
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Tự động sinh nhãn "Câu 1:", "Câu 2:" khi tạo mới các câu hỏi.</p>
                    </div>
                    <input type="checkbox" checked={autoNumbering} onChange={(e) => setAutoNumbering(e.target.checked)} className="h-4.5 w-4.5 text-primary focus:ring-primary border-border rounded cursor-pointer" />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
                    <div className="pr-4">
                        <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Shuffle className="w-3.5 h-3.5 text-primary" />
                            Tự động trộn phương án trắc nghiệm
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Hỗ trợ tự động đảo thứ tự ngẫu nhiên A, B, C, D khi giáo viên xuất bản đề thi PDF.</p>
                    </div>
                    <input type="checkbox" checked={shuffleOptions} onChange={(e) => setShuffleOptions(e.target.checked)} className="h-4.5 w-4.5 text-primary focus:ring-primary border-border rounded cursor-pointer" />
                </div>
            </div>
        </div>
    );
}
