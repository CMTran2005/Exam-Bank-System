import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useConfirm } from "@/context/ConfirmContext";

const runWithTimeout = (promise, ms = 1000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Hết thời gian chờ phản hồi Firebase")), ms)
        )
    ]);
};

export function useExams(currentUser) {
    const confirmDialog = useConfirm();
    const [exams, setExams] = useState([]);
    const [folders, setFolders] = useState([{ id: "all", name: "Tất cả đề thi" }]);
    const [activeFolder, setActiveFolder] = useState("all");
    const [selectedExams, setSelectedExams] = useState([]);
    const [mounted, setMounted] = useState(false);
    const [displaySettings, setDisplaySettings] = useState({
        id: true, year: true, grade: true, subject: true, province: true,
        duration: true, total_questions: true, updatedAt: true
    });

    useEffect(() => {
        setMounted(true);
        if (!currentUser) return;

        const fetchExams = async () => {
            let list = [];
            try {
                const q = query(collection(db, "exams"), where("uid", "==", currentUser.uid));
                const querySnapshot = await runWithTimeout(getDocs(q), 1500);
                querySnapshot.forEach((doc) => list.push({ ...doc.data(), id: doc.id }));
            } catch (e) {
                console.warn("Bỏ qua lỗi Firestore khi tải đề thi, dùng LocalStorage");
            }

            if (list.length === 0) {
                const savedExams = localStorage.getItem("eb_exams");
                if (savedExams) {
                    try { list = JSON.parse(savedExams); } catch (err) { }
                }
            } else {
                localStorage.setItem("eb_exams", JSON.stringify(list));
            }
            setExams(list);

            const savedSettings = localStorage.getItem("eb_exam_display_settings");
            if (savedSettings) {
                try { setDisplaySettings(JSON.parse(savedSettings)); } catch (e) {}
            }

            let folderList = [{ id: "all", name: "Tất cả đề thi" }];
            try {
                const fq = query(collection(db, "folders"), where("uid", "==", currentUser.uid));
                const folderSnap = await runWithTimeout(getDocs(fq), 1500);
                folderSnap.forEach((doc) => {
                    folderList.push({ id: doc.id, ...doc.data() });
                });
            } catch (e) {
                console.warn("Lỗi tải folder từ Firebase, dùng LocalStorage");
            }

            if (folderList.length === 1) {
                const savedFolders = localStorage.getItem("eb_folders");
                if (savedFolders) {
                    try { folderList = JSON.parse(savedFolders); } catch(e) {}
                }
            } else {
                localStorage.setItem("eb_folders", JSON.stringify(folderList));
            }
            setFolders(folderList);
        };

        fetchExams();
    }, [currentUser]);

    const toggleSetting = (key) => {
        const updated = { ...displaySettings, [key]: !displaySettings[key] };
        setDisplaySettings(updated);
        localStorage.setItem("eb_exam_display_settings", JSON.stringify(updated));
    };

    const handleDeleteExam = async (id, e) => {
        if (e) e.preventDefault();
        if (!(await confirmDialog("Bạn có chắc chắn muốn xóa đề thi này không? Đề thi sẽ được chuyển vào Thùng rác.", "Xóa đề thi"))) return;
        
        const examToDelete = exams.find(ex => ex.id === id);
        if (!examToDelete) return;

        const trashedExam = { ...examToDelete, deletedAt: new Date().toISOString() };
        const updated = exams.filter(ex => ex.id !== id);
        
        setExams(updated);
        localStorage.setItem("eb_exams", JSON.stringify(updated));

        const savedTrash = JSON.parse(localStorage.getItem("eb_trash") || "[]");
        savedTrash.push(trashedExam);
        localStorage.setItem("eb_trash", JSON.stringify(savedTrash));

        try {
            await runWithTimeout(setDoc(doc(db, "trash_exams", id), trashedExam), 1200);
            await runWithTimeout(deleteDoc(doc(db, "exams", id)), 1200);
        } catch (err) {}
    };

    const handleBulkDelete = async () => {
        if (!selectedExams.length) return;
        if (!(await confirmDialog(`Bạn có chắc chắn muốn xóa ${selectedExams.length} đề thi đã chọn?`, "Xóa nhiều đề thi"))) return;

        const trashedExams = exams.filter(ex => selectedExams.includes(ex.id)).map(ex => ({
            ...ex, deletedAt: new Date().toISOString()
        }));

        const updatedExams = exams.filter(ex => !selectedExams.includes(ex.id));
        setExams(updatedExams);
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

    const handleMoveToFolder = async (folderId, targets) => {
        let updatedExams = [...exams];
        updatedExams = updatedExams.map(ex => 
            targets.includes(ex.id) ? { ...ex, folderId: folderId === "all" ? null : folderId } : ex
        );
        
        setExams(updatedExams);
        localStorage.setItem("eb_exams", JSON.stringify(updatedExams));

        for (const tid of targets) {
            try {
                await setDoc(doc(db, "exams", tid), { folderId: folderId === "all" ? null : folderId }, { merge: true });
            } catch (e) {}
        }
    };

    const handleTogglePublic = async (id, currentStatus) => {
        const updatedExams = exams.map(ex => ex.id === id ? { ...ex, isPublic: !currentStatus } : ex);
        setExams(updatedExams);
        localStorage.setItem("eb_exams", JSON.stringify(updatedExams));

        try {
            await runWithTimeout(setDoc(doc(db, "exams", id), { isPublic: !currentStatus }, { merge: true }), 1200);
        } catch (err) {
            console.error("Lỗi khi cập nhật isPublic", err);
        }
    };

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
        setFolders(updatedFolders);
        localStorage.setItem("eb_folders", JSON.stringify(updatedFolders));
        setActiveFolder(newFolder.id);
    };

    const handleDeleteFolder = async (folderId) => {
        if (!(await confirmDialog("Bạn có chắc chắn muốn xóa thư mục này?", "Xóa thư mục"))) return;

        const updatedFolders = folders.filter(f => f.id !== folderId);
        setFolders(updatedFolders);
        localStorage.setItem("eb_folders", JSON.stringify(updatedFolders));

        if (activeFolder === folderId) setActiveFolder("all");

        const updatedExams = exams.map(ex => ex.folderId === folderId ? { ...ex, folderId: null } : ex);
        setExams(updatedExams);
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
