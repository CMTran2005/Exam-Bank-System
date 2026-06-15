import { Heart, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export function EncourageModal({
    isOpen,
    onClose,
    selectedChild,
    encouragementMessage,
    setEncouragementMessage,
    selectedSticker,
    setSelectedSticker,
    stickers,
    sending,
    handleSendEncouragement
}) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-rose-600">
                        <Heart className="w-5 h-5 fill-rose-600" />
                        Gửi Lời Động Viên
                    </DialogTitle>
                    <DialogDescription>
                        Gửi một tin nhắn ngắn và nhãn dán khích lệ đến <strong>{selectedChild?.name}</strong>. Tin nhắn sẽ hiện lên màn hình của con ngay lập tức!
                    </DialogDescription>
                </DialogHeader>
                
                <div className="py-2 space-y-4">
                    <div>
                        <label className="text-sm font-bold text-foreground mb-2 block">Chọn Nhãn Dán (Sticker)</label>
                        <div className="flex gap-3 justify-between">
                            {stickers.map(sticker => (
                                <div 
                                    key={sticker.id}
                                    onClick={() => setSelectedSticker(sticker.id)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer border-2 transition-all ${selectedSticker === sticker.id ? `border-${sticker.color.split('-')[1]}-500 ${sticker.bg} scale-105` : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    <sticker.icon className={`w-8 h-8 ${sticker.color}`} />
                                    <span className="text-[10px] mt-1 font-bold text-slate-500 uppercase">{sticker.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-bold text-foreground mb-2 block">Lời Nhắn Gửi</label>
                        <Input 
                            value={encouragementMessage}
                            onChange={(e) => setEncouragementMessage(e.target.value)}
                            className="bg-background border-border"
                            placeholder="Viết vài dòng động viên con..."
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Hủy</Button>
                    <Button onClick={handleSendEncouragement} disabled={sending} className="bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20">
                        {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                        Gửi Yêu Thương
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
