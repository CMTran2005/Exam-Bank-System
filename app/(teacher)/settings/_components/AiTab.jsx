import { Cpu, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Component AiTab
 * Xử lý logic và chức năng liên quan.
 *
 * @param {any} 
    geminiKey - Tham số đầu vào
 * @returns {JSX.Element}
 */
export function AiTab({
    geminiKey, setGeminiKey, showKey, setShowKey,
    aiModel, setAiModel, ocrConfidence, setOcrConfidence,
    autoTranslate, setAutoTranslate
}) {
    return (
        <div className="space-y-4">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider pb-2 border-b border-border/60 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" />
                Cấu hình Google Gemini & Trợ lý OCR
            </h2>
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Gemini API Key</label>
                <div className="relative">
                    <Input
                        type={showKey ? "text" : "password"}
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        className="h-10 border-border pr-10"
                        placeholder="AIzaSy..."
                    />
                    <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
                <p className="text-[10px] text-muted-foreground">Key được mã hóa bảo mật cục bộ tại trình duyệt, phục vụ xử lý hình ảnh thành LaTeX.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Phiên bản mô hình AI chính</label>
                    <Select value={aiModel} onValueChange={setAiModel}>
                        <SelectTrigger className="h-10 border-border bg-background">
                            <SelectValue placeholder="Chọn Model AI" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Tốc độ cao & Tiết kiệm)</SelectItem>
                            <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Xử lý nâng cao & Sáng tạo)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Độ tự tin nhận diện tối thiểu (%)</label>
                    <Input type="number" min="0" max="100" value={ocrConfidence} onChange={(e) => setOcrConfidence(e.target.value)} className="h-10 border-border" />
                </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30 pt-2">
                <div className="pr-4">
                    <p className="text-xs font-bold text-foreground">Tự động dịch sang Tiếng Anh song ngữ</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Khi quét OCR câu hỏi, AI tự động dịch đề bài sang Tiếng Anh kẹp song ngữ bên dưới câu hỏi.</p>
                </div>
                <input type="checkbox" checked={autoTranslate} onChange={(e) => setAutoTranslate(e.target.checked)} className="h-4.5 w-4.5 text-primary focus:ring-primary border-border rounded cursor-pointer" />
            </div>
        </div>
    );
}
