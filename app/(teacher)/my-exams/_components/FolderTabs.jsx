import { Folder, FolderOpen, FolderPlus, Trash2, Check } from "lucide-react";

/**
 * Component FolderTabs
 * Xử lý logic và chức năng liên quan.
 *
 * @param {any}  folders - Tham số đầu vào
 * @returns {JSX.Element}
 */
export function FolderTabs({ folders, activeFolder, setActiveFolder, handleDeleteFolder, setIsCreateFolderModalOpen, examsLength }) {
    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {folders.map(folder => (
                <button
                    key={folder.id}
                    onClick={() => setActiveFolder(folder.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border ${
                        activeFolder === folder.id
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                    }`}
                >
                    {activeFolder === folder.id ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                    {folder.name}
                    {folder.id === "all" && (
                        <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                            activeFolder === folder.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                            {examsLength}
                        </span>
                    )}
                    {folder.id !== "all" && activeFolder === folder.id && (
                        <div 
                            onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id) }} 
                            className="ml-1 text-primary-foreground/70 hover:text-red-300 transition-colors p-0.5 rounded"
                            title="Xóa thư mục này"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </div>
                    )}
                </button>
            ))}
            <button 
                onClick={() => setIsCreateFolderModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-all whitespace-nowrap bg-muted/20"
            >
                <FolderPlus className="w-4 h-4" />
                Thư mục mới
            </button>
        </div>
    );
}
