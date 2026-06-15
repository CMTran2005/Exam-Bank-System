import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export function LinkStudentModal({
    isOpen,
    onClose,
    studentEmailOrId,
    setStudentEmailOrId,
    linking,
    handleLinkStudent
}) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-sky-500" />
                        Tìm và Liên kết Học sinh
                    </DialogTitle>
                    <DialogDescription>
                        Nhập Email hoặc Mã định danh (ID) của con bạn để gửi yêu cầu liên kết theo dõi học tập.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                    <label className="text-sm font-bold text-foreground mb-2 block">Email hoặc Mã ID</label>
                    <Input 
                        placeholder="ví dụ: hocsinh@gmail.com hoặc mã ID" 
                        value={studentEmailOrId}
                        onChange={(e) => setStudentEmailOrId(e.target.value)}
                        className="bg-background border-border"
                    />
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Hủy</Button>
                    <Button onClick={handleLinkStudent} disabled={linking} className="bg-sky-500 hover:bg-sky-600 text-white">
                        {linking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Tiến hành Liên kết
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
