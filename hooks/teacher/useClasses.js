import useSWR from "swr";
import { useState, useEffect } from "react";
import { classService } from "@/services/classService";
import useSubjects from "@/hooks/shared/useSubjects";
import { useConfirm } from "@/context/ConfirmContext";
import { toast } from "sonner";

/**
 * Hook quản lý danh sách và trạng thái của các Lớp thi do Giáo viên tạo.
 * Cung cấp chức năng xem, thêm, sửa, xóa, lấy mã QR và đặt lịch thi.
 * 
 * @param {Object} currentUser - Thông tin người dùng hiện tại (Giáo viên)
 * @returns {Object} Các hàm và state cần thiết để render giao diện quản lý lớp
 */
export function useClasses(currentUser) {
    const confirmDialog = useConfirm();
    const { gradeSubjectsMap, loading: subjectsLoading } = useSubjects();
    const GRADES = Object.keys(gradeSubjectsMap);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeDropdown, setActiveDropdown] = useState(null);

    // State quản lý hiển thị cửa sổ giao diện tạo lớp học mới
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newClassName, setNewClassName] = useState("");
    const [newSchoolYear, setNewSchoolYear] = useState("2025-2026");
    const [newGrade, setNewGrade] = useState("12"); 
    const [newSubject, setNewSubject] = useState("Toán học"); 
    const [examDate, setExamDate] = useState("");
    const [examTime, setExamTime] = useState("");
    const [examDuration, setExamDuration] = useState(45);
    const [isCreating, setIsCreating] = useState(false);

    const [qrModalCode, setQrModalCode] = useState(null);

    /**
     * Bật/tắt menu tùy chọn (dropdown) của một lớp thi cụ thể
     * @param {string} name - ID của lớp cần thao tác
     */
    const toggleDropdown = (name) => {
        setActiveDropdown(activeDropdown === name ? null : name);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                if (isCreateModalOpen) {
                    setIsCreateModalOpen(false);
                    setActiveDropdown(null);
                }
                if (qrModalCode) setQrModalCode(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isCreateModalOpen, qrModalCode]);

    const fetcher = async () => {
        return await classService.getTeacherClasses(currentUser.uid);
    };

    const { data: classes = [], isLoading: classesLoading, mutate } = useSWR(
        currentUser ? `classes-${currentUser.uid}` : null,
        fetcher,
        { revalidateOnFocus: true }
    );

    const loading = classesLoading || subjectsLoading;

    /**
     * Khởi tạo một lớp thi mới dựa trên form thông tin người dùng đã nhập
     * @param {Event} e - Sự kiện submit form
     */
    const handleCreateClass = async (e) => {
        if (e) e.preventDefault();
        if (!newClassName.trim() || !currentUser) return;
        
        setIsCreating(true);
        try {
            let computedStartTime = null;
            let computedEndTime = null;
            
            if (examDate && examTime) {
                computedStartTime = new Date(`${examDate}T${examTime}`).toISOString();
                const end = new Date(new Date(computedStartTime).getTime() + examDuration * 60000);
                computedEndTime = end.toISOString();
            }

            const classData = {
                name: newClassName,
                schoolYear: newSchoolYear,
                grade: newGrade,
                subject: newSubject,
                startTime: computedStartTime,
                endTime: computedEndTime,
                duration: examDuration,
                teacherId: currentUser.uid,
                classCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
                status: "active",
                color: ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500", "bg-rose-500"][Math.floor(Math.random() * 5)]
            };
            
            const newClass = await classService.createClass(classData);
            mutate([...classes, newClass], false); // Đồng bộ hóa dữ liệu cục bộ ngay lập tức (không đợi máy chủ)
            setIsCreateModalOpen(false);
            setNewClassName("");
        } catch (error) {
            toast.error("Lỗi khi tạo lớp thi!");
        } finally {
            setIsCreating(false);
        }
    };

    /**
     * Xóa vĩnh viễn một lớp thi cùng toàn bộ dữ liệu đi kèm sau khi xác nhận
     * @param {string} classId - ID của lớp thi cần xóa
     */
    const handleDeleteClass = async (classId) => {
        if (await confirmDialog("Bạn có chắc chắn muốn xóa lớp thi này không? Toàn bộ dữ liệu sẽ bị xóa!", "Xóa lớp thi")) {
            try {
                await classService.deleteClass(classId);
                mutate(classes.filter(c => c.id !== classId), false);
                toast.success("Đã xóa lớp thi!");
            } catch (error) {
                toast.error("Lỗi xóa lớp thi!");
            }
        }
    };

    /**
     * Tạo mã tham gia lớp (Class Code) mới để ngăn chặn truy cập trái phép bằng mã cũ
     * @param {string} classId - ID của lớp thi cần làm mới mã
     */
    const handleRefreshCode = async (classId) => {
        if (await confirmDialog("Làm mới mã lớp sẽ khiến các thí sinh dùng mã cũ không thể truy cập. Bạn có chắc chắn không?", "Làm mới mã lớp")) {
            try {
                const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                await classService.updateClass(classId, { classCode: newCode });
                mutate(classes.map(c => c.id === classId ? { ...c, classCode: newCode } : c), false);
                if (qrModalCode) setQrModalCode(newCode);
                toast.success("Đã làm mới mã lớp thành công!");
            } catch (error) {
                toast.error("Lỗi làm mới mã lớp!");
            }
        }
    };

    const filteredClasses = classes.filter(cls => 
        cls.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return {
        gradeSubjectsMap, GRADES, searchQuery, setSearchQuery, classes, loading: loading || subjectsLoading,
        activeDropdown, setActiveDropdown, toggleDropdown,
        isCreateModalOpen, setIsCreateModalOpen,
        newClassName, setNewClassName, newSchoolYear, setNewSchoolYear,
        newGrade, setNewGrade, newSubject, setNewSubject,
        examDate, setExamDate, examTime, setExamTime, examDuration, setExamDuration,
        isCreating, qrModalCode, setQrModalCode,
        handleCreateClass, handleDeleteClass, handleRefreshCode, filteredClasses
    };
}
