import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GRADE_SUBJECTS_MAP as DEFAULT_MAP } from "@/lib/constants";

export const subjectService = {
    /**
     * Lấy danh sách ánh xạ (Map) các môn học theo từng khối lớp từ hệ thống.
     * Nếu chưa có dữ liệu, hệ thống sẽ tự động khởi tạo bằng dữ liệu cấu hình mặc định.
     * @returns {Promise<Object>} - Đối tượng chứa thông tin môn học của từng khối
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
     * Cập nhật danh sách ánh xạ các môn học vào hệ thống
     * @param {Object} newMap - Đối tượng ánh xạ mới cần cập nhật
     * @returns {Promise<boolean>} - Trả về true nếu cập nhật thành công
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
