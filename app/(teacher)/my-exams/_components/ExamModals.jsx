import { X, Folder, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ExamModals({
    isCreateFolderModalOpen, setIsCreateFolderModalOpen,
    newFolderName, setNewFolderName, handleCreateFolder,
    isCreatingFolder,
    isMoveExamModalOpen, setIsMoveExamModalOpen,
    examToMove, folders, handleMoveToFolder, selectedExams
}) {
    return (
        <>
            {isCreateFolderModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-border/60">
                            <h3 className="font-bold text-foreground">Tạo thư mục mới</h3>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full" onClick={() => setIsCreateFolderModalOpen(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); handleCreateFolder(newFolderName); setNewFolderName(""); }} className="p-4 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground">Tên thư mục</label>
                                <Input 
                                    autoFocus
                                    placeholder="Nhập tên thư mục..." 
                                    className="h-11 rounded-xl text-sm"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                                <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => setIsCreateFolderModalOpen(false)}>
                                    Hủy bỏ
                                </Button>
                                <Button type="submit" disabled={isCreatingFolder || !newFolderName.trim()} className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold min-w-[100px]">
                                    {isCreatingFolder ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tạo mới"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isMoveExamModalOpen && examToMove && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between p-4 border-b border-border/60 shrink-0">
                            <h3 className="font-bold text-foreground">Chuyển thư mục lưu trữ</h3>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full" onClick={() => setIsMoveExamModalOpen(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="p-4 flex-1 overflow-hidden flex flex-col">
                            <p className="text-sm text-muted-foreground mb-3 shrink-0">
                                Đang chuyển: <strong className="text-foreground line-clamp-1 mt-1">{examToMove === "BULK" ? `${selectedExams.length} đề thi` : examToMove.title}</strong>
                            </p>
                            <div className="space-y-1.5 overflow-y-auto pr-1">
                                {folders.map(folder => {
                                    const isCurrentFolder = examToMove !== "BULK" && ((examToMove.folderId === folder.id) || (folder.id === 'all' && !examToMove.folderId));
                                    return (
                                    <div 
                                        key={folder.id}
                                        onClick={() => {
                                            const targets = examToMove === "BULK" ? selectedExams : [examToMove.id];
                                            handleMoveToFolder(folder.id, targets);
                                            setIsMoveExamModalOpen(false);
                                        }}
                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                            isCurrentFolder
                                                ? "bg-blue-50/50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/50 text-blue-700 dark:text-blue-400 font-bold" 
                                                : "border-border/50 hover:border-primary/40 hover:bg-muted text-foreground"
                                        }`}
                                    >
                                        <Folder className="w-4 h-4" />
                                        <span className="text-sm truncate">{folder.name}</span>
                                        {isCurrentFolder && (
                                            <Check className="w-4 h-4 ml-auto shrink-0" />
                                        )}
                                    </div>
                                )})}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
