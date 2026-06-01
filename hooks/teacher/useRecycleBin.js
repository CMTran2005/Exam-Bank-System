import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useConfirm } from "@/context/ConfirmContext";
import { doc, deleteDoc, collection, query, where, getDocs, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const runWithTimeout = (promise, ms = 1000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Hết thời gian chờ phản hồi Firebase")), ms)
        )
    ]);
};

/**
 * Hàm useRecycleBin
 * Xử lý logic và chức năng liên quan.
 *
 * @returns {any}
 */
export function useRecycleBin() {
    const confirmDialog = useConfirm();
    const { currentUser, loading } = useAuth();
    const router = useRouter();
    const [trashExams, setTrashExams] = useState([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (!loading && !currentUser) {
            router.push("/login");
        }
    }, [currentUser, loading, router]);

    useEffect(() => {
        setMounted(true);
        const fetchTrash = async () => {
            if (typeof window !== "undefined") {
                let list = [];
                try {
                    const q = query(collection(db, "trash_exams"), where("uid", "==", currentUser?.uid || "anonymous"));
                    const querySnapshot = await runWithTimeout(getDocs(q), 1500);
                    querySnapshot.forEach((doc) => {
                        list.push(doc.data());
                    });
                } catch (e) {
                    console.warn("Bỏ qua lỗi Firestore khi tải thùng rác, dùng LocalStorage:", e.message);
                }

                if (list.length === 0) {
                    const savedTrash = localStorage.getItem("eb_trash");
                    if (savedTrash) {
                        try {
                            list = JSON.parse(savedTrash);
                        } catch (err) {
                            list = [];
                        }
                    }
                } else {
                    localStorage.setItem("eb_trash", JSON.stringify(list));
                }

                // Tự động giải phóng dung lượng: Xóa vĩnh viễn các mục đã nằm trong thùng rác quá 30 ngày
                const now = new Date();
                const validList = list.filter(ex => {
                    const deletedDate = ex.deletedAt ? new Date(ex.deletedAt) : new Date(ex.updatedAt);
                    const daysDiff = (now - deletedDate) / (1000 * 60 * 60 * 24);
                    return daysDiff <= 30;
                });

                if (validList.length !== list.length) {
                    localStorage.setItem("eb_trash", JSON.stringify(validList));
                }

                setTrashExams(validList);
            }
        };

        if (currentUser) {
            fetchTrash();
        }
    }, [currentUser]);

    const handleRestore = async (id, e) => {
        e.preventDefault();
        const examToRestore = trashExams.find(ex => ex.id === id);
        if (!examToRestore) return;

        const { deletedAt, ...restoredExam } = examToRestore;

        const updatedTrash = trashExams.filter(ex => ex.id !== id);
        setTrashExams(updatedTrash);
        localStorage.setItem("eb_trash", JSON.stringify(updatedTrash));

        const savedExams = JSON.parse(localStorage.getItem("eb_exams") || "[]");
        savedExams.push(restoredExam);
        localStorage.setItem("eb_exams", JSON.stringify(savedExams));

        try {
            const examDocRef = doc(db, "exams", id);
            await runWithTimeout(setDoc(examDocRef, restoredExam), 1200);

            const trashDocRef = doc(db, "trash_exams", id);
            await runWithTimeout(deleteDoc(trashDocRef), 1200);
        } catch (err) {
            console.warn("Lỗi đồng bộ Firestore khi khôi phục:", err.message);
        }
    };

    const handlePermanentDelete = async (id, e) => {
        e.preventDefault();
        if (await confirmDialog("Hành động này sẽ XÓA VĨNH VIỄN đề thi và không thể khôi phục. Bạn có chắc chắn?", "Xóa vĩnh viễn")) {
            const updatedTrash = trashExams.filter(ex => ex.id !== id);
            setTrashExams(updatedTrash);
            localStorage.setItem("eb_trash", JSON.stringify(updatedTrash));

            try {
                const trashDocRef = doc(db, "trash_exams", id);
                await runWithTimeout(deleteDoc(trashDocRef), 1200);
            } catch (err) {
                console.warn("Lỗi xóa Firestore:", err.message);
            }
        }
    };

    const handleEmptyTrash = async () => {
        if (await confirmDialog("Bạn có chắc chắn muốn dọn sạch thùng rác? Toàn bộ đề thi trong này sẽ bị xóa vĩnh viễn.", "Dọn sạch thùng rác")) {
            const idsToDelete = trashExams.map(ex => ex.id);
            
            setTrashExams([]);
            localStorage.setItem("eb_trash", JSON.stringify([]));

            try {
                for (const id of idsToDelete) {
                    const trashDocRef = doc(db, "trash_exams", id);
                    await deleteDoc(trashDocRef);
                }
            } catch (err) {
                console.warn("Lỗi dọn rác Firestore:", err.message);
            }
        }
    };

    return {
        currentUser, loading, mounted,
        trashExams, handleRestore, handlePermanentDelete, handleEmptyTrash
    };
}
