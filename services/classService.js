import { collection, doc, setDoc, getDocs, query, where, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const runWithTimeout = (promise, ms = 2000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Hết thời gian chờ phản hồi Firebase")), ms)
        )
    ]);
};

export const classService = {
    /**
     * Lấy danh sách lớp học của một giáo viên
     */
    async getTeacherClasses(teacherUid) {
        if (!teacherUid) return [];
        try {
            const q = query(collection(db, "classes"), where("teacherId", "==", teacherUid));
            const querySnapshot = await runWithTimeout(getDocs(q));
            const list = [];
            querySnapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() });
            });
            return list;
        } catch (error) {
            console.warn("Lỗi getTeacherClasses:", error);
            throw error;
        }
    },

    /**
     * Lấy chi tiết lớp học
     */
    async getClassDetails(classId) {
        try {
            const docRef = doc(db, "classes", classId);
            const docSnap = await runWithTimeout(import("firebase/firestore").then(m => m.getDoc(docRef)));
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error("Lỗi getClassDetails:", error);
            throw error;
        }
    },

    /**
     * Cập nhật thông tin lớp học
     */
    async updateClass(classId, data) {
        try {
            const docRef = doc(db, "classes", classId);
            await runWithTimeout(updateDoc(docRef, data));
            return true;
        } catch (error) {
            console.error("Lỗi updateClass:", error);
            throw error;
        }
    },

    /**
     * Tạo lớp học mới
     */
    async createClass(classData) {
        try {
            const classId = `class_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            const newClass = {
                id: classId,
                ...classData,
                createdAt: new Date().toISOString(),
                studentCount: 0,
            };
            const docRef = doc(db, "classes", classId);
            await runWithTimeout(setDoc(docRef, newClass));
            return newClass;
        } catch (error) {
            console.error("Lỗi createClass:", error);
            throw error;
        }
    },

    /**
     * Xóa lớp học
     */
    async deleteClass(classId) {
        try {
            const docRef = doc(db, "classes", classId);
            await runWithTimeout(deleteDoc(docRef));
            return true;
        } catch (error) {
            console.error("Lỗi deleteClass:", error);
            throw error;
        }
    }
};
