import { useState, useEffect } from "react";
import { classService } from "@/services/classService";
import { GRADE_SUBJECTS_MAP } from "@/lib/constants";

export function useClasses(currentUser) {
    const GRADES = Object.keys(GRADE_SUBJECTS_MAP);
    const [searchQuery, setSearchQuery] = useState("");
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Create modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newClassName, setNewClassName] = useState("");
    const [newSchoolYear, setNewSchoolYear] = useState("2025-2026");
    const [newGrade, setNewGrade] = useState(GRADES[11]); 
    const [newSubject, setNewSubject] = useState(GRADE_SUBJECTS_MAP[GRADES[11]][0]); 
    const [examDate, setExamDate] = useState("");
    const [examTime, setExamTime] = useState("");
    const [examDuration, setExamDuration] = useState(45);
    const [isCreating, setIsCreating] = useState(false);

    const [qrModalCode, setQrModalCode] = useState(null);

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

    useEffect(() => {
        if (!currentUser) return;
        const fetchClasses = async () => {
            setLoading(true);
            try {
                const data = await classService.getTeacherClasses(currentUser.uid);
                setClasses(data);
            } catch (error) {
                console.error("Lỗi tải lớp học:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchClasses();
    }, [currentUser]);

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
            setClasses([...classes, newClass]);
            setIsCreateModalOpen(false);
            setNewClassName("");
        } catch (error) {
            alert("Lỗi khi tạo lớp thi!");
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteClass = async (classId) => {
        if (confirm("Bạn có chắc chắn muốn xóa lớp thi này không? Toàn bộ dữ liệu sẽ bị xóa!")) {
            try {
                await classService.deleteClass(classId);
                setClasses(classes.filter(c => c.id !== classId));
            } catch (error) {
                alert("Lỗi xóa lớp thi!");
            }
        }
    };

    const handleRefreshCode = async (classId) => {
        if (confirm("Làm mới mã lớp sẽ khiến các thí sinh dùng mã cũ không thể truy cập. Bạn có chắc chắn không?")) {
            try {
                const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                await classService.updateClass(classId, { classCode: newCode });
                setClasses(classes.map(c => c.id === classId ? { ...c, classCode: newCode } : c));
                if (qrModalCode) setQrModalCode(newCode);
                alert("Đã làm mới mã lớp thành công!");
            } catch (error) {
                alert("Lỗi làm mới mã lớp!");
            }
        }
    };

    const filteredClasses = classes.filter(cls => 
        cls.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return {
        GRADES, searchQuery, setSearchQuery, classes, loading,
        activeDropdown, setActiveDropdown, toggleDropdown,
        isCreateModalOpen, setIsCreateModalOpen,
        newClassName, setNewClassName, newSchoolYear, setNewSchoolYear,
        newGrade, setNewGrade, newSubject, setNewSubject,
        examDate, setExamDate, examTime, setExamTime, examDuration, setExamDuration,
        isCreating, qrModalCode, setQrModalCode,
        handleCreateClass, handleDeleteClass, handleRefreshCode, filteredClasses
    };
}
