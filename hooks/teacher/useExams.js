import { useState, useEffect } from "react";
import useSWR from "swr";
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useConfirm } from "@/context/ConfirmContext";
import { examCollaborationService } from "@/services/examCollaborationService";

/**
 * Chạy một Promise với thời gian giới hạn (timeout).
 * Tránh trường hợp request bị treo vô hạn khi mạng yếu hoặc server phản hồi chậm.
 * 
 * @param {Promise} promise - Promise cần thực thi
 * @param {number} ms - Thời gian chờ tối đa (mili-giây)
 * @returns {Promise<any>} Kết quả của Promise hoặc ném lỗi nếu quá thời gian chờ
 */
const runWithTimeout = (promise, ms = 1000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Hết thời gian chờ phản hồi Firebase")), ms)
        )
    ]);
};

/**
 * Hook quản lý toàn bộ dữ liệu Đề thi và Thư mục của Giáo viên
 * Hỗ trợ các tính năng: lấy danh sách, xóa (chuyển vào thùng rác), di chuyển thư mục, thay đổi trạng thái chia sẻ
 * 
 * @param {Object} currentUser - Đối tượng chứa thông tin người dùng (Giáo viên) hiện tại
 * @returns {Object} - Các state và hàm điều khiển (exams, folders, activeFolder, handleDeleteExam,...)
 */
export function useExams(currentUser) {
    const confirmDialog = useConfirm();
    const { data: exams = [], mutate: mutateExams } = useSWR(
        currentUser ? `exams_${currentUser.uid}` : null,
        async () => {
            // Tự động dọn dẹp các phiên (sessions) mồ côi ngầm trong background
            examCollaborationService.cleanUpAbandonedSessions(currentUser.uid).catch(() => {});

            const q = query(collection(db, "exams"), where("uid", "==", currentUser.uid));
            const snapshot = await runWithTimeout(getDocs(q), 1500);
            const list = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
            localStorage.setItem("eb_exams", JSON.stringify(list));
            return list;
        },
        { 
            fallbackData: (() => {
                if (typeof window === "undefined") return [];
                try { return JSON.parse(localStorage.getItem("eb_exams")) || []; } catch (e) { return []; }
            })() 
        }
    );

    const { data: folders = [{ id: "all", name: "Tất cả đề thi" }], mutate: mutateFolders } = useSWR(
        currentUser ? `folders_${currentUser.uid}` : null,
        async () => {
            const fq = query(collection(db, "folders"), where("uid", "==", currentUser.uid));
            const folderSnap = await runWithTimeout(getDocs(fq), 1500);
            const folderList = [{ id: "all", name: "Tất cả đề thi" }];
            folderSnap.forEach((doc) => folderList.push({ id: doc.id, ...doc.data() }));
            localStorage.setItem("eb_folders", JSON.stringify(folderList));
            return folderList;
        },
        { 
            fallbackData: (() => {
                if (typeof window === "undefined") return [{ id: "all", name: "Tất cả đề thi" }];
                try { return JSON.parse(localStorage.getItem("eb_folders")) || [{ id: "all", name: "Tất cả đề thi" }]; } 
                catch (e) { return [{ id: "all", name: "Tất cả đề thi" }]; }
            })() 
        }
    );

    const [activeFolder, setActiveFolder] = useState("all");
    const [selectedExams, setSelectedExams] = useState([]);
    const [mounted, setMounted] = useState(false);
    const [displaySettings, setDisplaySettings] = useState({
        id: true, year: true, grade: true, subject: true, province: true,
        duration: true, total_questions: true, updatedAt: true
    });

    useEffect(() => {
        setMounted(true);
        if (typeof window !== "undefined") {
            const savedSettings = localStorage.getItem("eb_exam_display_settings");
            if (savedSettings) {
                try { setDisplaySettings(JSON.parse(savedSettings)); } catch (e) {}
            }
        }
    }, []);

    const toggleSetting = (key) => {
        const updated = { ...displaySettings, [key]: !displaySettings[key] };
        setDisplaySettings(updated);
        localStorage.setItem("eb_exam_display_settings", JSON.stringify(updated));
    };

    /**
     * Chuyển đề thi vào Thùng rác (Recycle Bin) thay vì xóa vĩnh viễn
     * @param {string} id - ID của đề thi cần xóa
     * @param {Event} e - Sự kiện click (tùy chọn)
     */
    const handleDeleteExam = async (id, e) => {
        if (e) e.preventDefault();
        if (!(await confirmDialog("Bạn có chắc chắn muốn xóa đề thi này không? Đề thi sẽ được chuyển vào Thùng rác.", "Xóa đề thi"))) return;
        
        const examToDelete = exams.find(ex => ex.id === id);
        if (!examToDelete) return;

        const trashedExam = { ...examToDelete, deletedAt: new Date().toISOString() };
        const updated = exams.filter(ex => ex.id !== id);
        mutateExams(updated, false);
        localStorage.setItem("eb_exams", JSON.stringify(updated));

        const savedTrash = JSON.parse(localStorage.getItem("eb_trash") || "[]");
        savedTrash.push(trashedExam);
        localStorage.setItem("eb_trash", JSON.stringify(savedTrash));

        try {
            await runWithTimeout(setDoc(doc(db, "trash_exams", id), trashedExam), 1200);
            await runWithTimeout(deleteDoc(doc(db, "exams", id)), 1200);
        } catch (err) {}
    };

    /**
     * Xóa hàng loạt nhiều đề thi cùng lúc (Chuyển vào Thùng rác).
     * Cập nhật danh sách hiện tại và lưu các đề thi đã xóa vào danh sách chờ khôi phục.
     * Yêu cầu xác nhận từ người dùng trước khi xóa.
     * @returns {Promise<void>}
     */
    const handleBulkDelete = async () => {
        if (!selectedExams.length) return;
        if (!(await confirmDialog(`Bạn có chắc chắn muốn xóa ${selectedExams.length} đề thi đã chọn?`, "Xóa nhiều đề thi"))) return;

        const trashedExams = exams.filter(ex => selectedExams.includes(ex.id)).map(ex => ({
            ...ex, deletedAt: new Date().toISOString()
        }));

        const updatedExams = exams.filter(ex => !selectedExams.includes(ex.id));
        mutateExams(updatedExams, false);
        localStorage.setItem("eb_exams", JSON.stringify(updatedExams));

        const savedTrash = JSON.parse(localStorage.getItem("eb_trash") || "[]");
        localStorage.setItem("eb_trash", JSON.stringify([...savedTrash, ...trashedExams]));

        for (const exam of trashedExams) {
            try {
                await setDoc(doc(db, "trash_exams", exam.id), exam);
                await deleteDoc(doc(db, "exams", exam.id));
            } catch(e) {}
        }
        setSelectedExams([]);
    };

    /**
     * Di chuyển một hoặc nhiều đề thi vào một thư mục cụ thể
     * @param {string} folderId - ID của thư mục đích (hoặc 'all' nếu muốn đưa ra ngoài)
     * @param {Array<string>} targets - Danh sách ID các đề thi cần di chuyển
     */
    const handleMoveToFolder = async (folderId, targets) => {
        let updatedExams = [...exams];
        updatedExams = updatedExams.map(ex => 
            targets.includes(ex.id) ? { ...ex, folderId: folderId === "all" ? null : folderId } : ex
        );
        
        mutateExams(updatedExams, false);
        localStorage.setItem("eb_exams", JSON.stringify(updatedExams));

        for (const tid of targets) {
            try {
                await setDoc(doc(db, "exams", tid), { folderId: folderId === "all" ? null : folderId }, { merge: true });
            } catch (e) {}
        }
    };

    /**
     * Chuyển đổi trạng thái chia sẻ công khai (Public/Private) của đề thi
     * @param {string} id - ID của đề thi
     * @param {boolean} currentStatus - Trạng thái chia sẻ hiện tại
     */
    const handleTogglePublic = async (id, currentStatus) => {
        const updatedExams = exams.map(ex => ex.id === id ? { ...ex, isPublic: !currentStatus } : ex);
        mutateExams(updatedExams, false);
        localStorage.setItem("eb_exams", JSON.stringify(updatedExams));

        try {
            await runWithTimeout(setDoc(doc(db, "exams", id), { isPublic: !currentStatus }, { merge: true }), 1200);
        } catch (err) {
            console.error("Lỗi khi cập nhật isPublic", err);
        }
    };

    /**
     * Tạo một thư mục mới để phân loại đề thi
     * @param {string} newFolderName - Tên thư mục mới
     */
    const handleCreateFolder = async (newFolderName) => {
        if (!newFolderName.trim()) return;

        const newFolder = {
            id: `f_${Date.now()}`,
            name: newFolderName.trim(),
            uid: currentUser.uid,
            createdAt: new Date().toISOString()
        };

        try {
            await runWithTimeout(setDoc(doc(db, "folders", newFolder.id), newFolder), 1000);
        } catch (e) {}

        const updatedFolders = [...folders, newFolder];
        mutateFolders(updatedFolders, false);
        localStorage.setItem("eb_folders", JSON.stringify(updatedFolders));
        setActiveFolder(newFolder.id);
    };

    /**
     * Xóa một thư mục và đưa toàn bộ đề thi bên trong ra ngoài màn hình chính
     * @param {string} folderId - ID của thư mục cần xóa
     */
    const handleDeleteFolder = async (folderId) => {
        if (!(await confirmDialog("Bạn có chắc chắn muốn xóa thư mục này?", "Xóa thư mục"))) return;

        const updatedFolders = folders.filter(f => f.id !== folderId);
        mutateFolders(updatedFolders, false);
        localStorage.setItem("eb_folders", JSON.stringify(updatedFolders));

        if (activeFolder === folderId) setActiveFolder("all");

        const updatedExams = exams.map(ex => ex.folderId === folderId ? { ...ex, folderId: null } : ex);
        mutateExams(updatedExams, false);
        localStorage.setItem("eb_exams", JSON.stringify(updatedExams));

        try {
            await runWithTimeout(deleteDoc(doc(db, "folders", folderId)), 1500);
            const examsToUpdate = exams.filter(ex => ex.folderId === folderId);
            for (const ex of examsToUpdate) {
                await setDoc(doc(db, "exams", ex.id), { folderId: null }, { merge: true });
            }
        } catch (e) {}
    };

    return {
        exams, folders, activeFolder, setActiveFolder,
        selectedExams, setSelectedExams,
        displaySettings, toggleSetting, mounted,
        handleDeleteExam, handleBulkDelete, handleMoveToFolder,
        handleCreateFolder, handleDeleteFolder, handleTogglePublic
    };
}
