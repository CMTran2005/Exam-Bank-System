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
     * Lấy danh sách toàn bộ lớp học do một giáo viên quản lý
     * @param {string} teacherUid - ID của giáo viên
     * @returns {Promise<Array>} - Danh sách các lớp học
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
     * Lấy thông tin chi tiết của một lớp học cụ thể
     * @param {string} classId - Mã định danh của lớp học
     * @returns {Promise<Object|null>} - Dữ liệu lớp học hoặc null nếu không tìm thấy
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
     * Cập nhật thông tin của lớp học
     * @param {string} classId - Mã định danh của lớp học cần cập nhật
     * @param {Object} data - Dữ liệu mới cần ghi đè/cập nhật
     * @returns {Promise<boolean>} - Trả về true nếu thành công
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
     * Khởi tạo một lớp học mới trong hệ thống
     * @param {Object} classData - Thông tin cấu hình ban đầu của lớp
     * @returns {Promise<Object>} - Thông tin lớp học vừa được tạo (bao gồm cả ID mới)
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
     * Xóa hoàn toàn một lớp học khỏi hệ thống
     * @param {string} classId - Mã định danh của lớp học cần xóa
     * @returns {Promise<boolean>} - Trả về true nếu xóa thành công
     */
    async deleteClass(classId) {
        try {
            // 1. Xóa tất cả các thành viên (học sinh) liên kết với lớp học này
            const membersQuery = query(collection(db, "class_members"), where("classId", "==", classId));
            const membersSnap = await getDocs(membersQuery);
            const deletePromises = membersSnap.docs.map(memberDoc => deleteDoc(doc(db, "class_members", memberDoc.id)));
            await Promise.all(deletePromises);

            // 2. Xóa thông tin lớp học chính
            const docRef = doc(db, "classes", classId);
            await runWithTimeout(deleteDoc(docRef));
            return true;
        } catch (error) {
            console.error("Lỗi deleteClass:", error);
            throw error;
        }
    }
};
