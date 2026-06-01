import { ArrowRightLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Component BulkActionBar
 * Xử lý logic và chức năng liên quan.
 *
 * @param {any}  selectedExams - Tham số đầu vào
 * @returns {JSX.Element}
 */
export function BulkActionBar({ selectedExams, handleBulkDelete, onMove }) {
    if (selectedExams.length === 0) return null;

    return (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                Đã chọn {selectedExams.length} đề thi
            </span>
            <div className="flex items-center gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onMove}
                    className="h-8 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800"
                >
                    <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
                    Chuyển
                </Button>
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleBulkDelete}
                    className="h-8 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
                >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Xóa
                </Button>
            </div>
        </div>
    );
}
