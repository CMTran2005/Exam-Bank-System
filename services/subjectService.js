import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GRADE_SUBJECTS_MAP as DEFAULT_MAP } from "@/lib/constants";

export const subjectService = {
    /**
     * Lấy danh sách bản đồ môn học từ Firebase
     * Nếu chưa có sẽ tự động khởi tạo bằng dữ liệu mặc định
     */
    async getSubjectsMap() {
        try {
            const docRef = doc(db, "system", "subjects_map");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data().map;
            } else {
                // Initialize
                await setDoc(docRef, { map: DEFAULT_MAP });
                return DEFAULT_MAP;
            }
        } catch (error) {
            console.error("Error fetching subjects map:", error);
            return DEFAULT_MAP;
        }
    },

    /**
     * Cập nhật bản đồ môn học
     */
    async updateSubjectsMap(newMap) {
        try {
            const docRef = doc(db, "system", "subjects_map");
            await setDoc(docRef, { map: newMap });
            return true;
        } catch (error) {
            console.error("Error updating subjects map:", error);
            throw error;
        }
    }
};
