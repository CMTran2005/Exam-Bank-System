import useSWR from "swr";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

/**
 * Hook quản lý danh sách học sinh (con em) được liên kết với tài khoản phụ huynh.
 * Hỗ trợ lấy thông tin, điểm trung bình và liên kết thêm học sinh mới.
 * 
 * @param {Object} currentUser - Đối tượng người dùng (phụ huynh) hiện tại
 * @returns {Object} Đối tượng chứa dữ liệu danh sách học sinh, trạng thái tải và các hàm điều khiển (linkStudent, fetchChildren)
 */
export function useChildren(currentUser) {
    /**
     * Hàm lấy thông tin chi tiết và điểm số của danh sách học sinh
     * @param {Array<string>} childrenIds - Mảng chứa các ID của học sinh
     * @returns {Promise<Array>} Danh sách chi tiết thông tin và thống kê của từng học sinh
     */
    const fetcher = async (childrenIds) => {
        if (!childrenIds || childrenIds.length === 0) return [];
        
        const data = [];
        for (const childId of childrenIds) {
            const childSnap = await getDoc(doc(db, "users", childId));
            if (childSnap.exists()) {
                const attemptQuery = query(collection(db, "exam_attempts"), where("studentId", "==", childId));
                const attemptSnap = await getDocs(attemptQuery);
                
                let totalScore = 0;
                let examsTaken = attemptSnap.size;
                
                attemptSnap.docs.forEach(d => {
                    totalScore += Number(d.data().score || 0);
                });

                data.push({
                    ...childSnap.data(),
                    id: childSnap.id,
                    examsTaken,
                    avgScore: examsTaken > 0 ? (totalScore / examsTaken).toFixed(1) : 0
                });
            }
        }
        return data;
    };

    const { data, error, isLoading, mutate } = useSWR(
        currentUser?.uid ? `parent_children_${currentUser.uid}_${currentUser?.children?.length || 0}` : null,
        () => fetcher(currentUser?.children),
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000,
        }
    );

    /**
     * Liên kết một học sinh mới vào tài khoản phụ huynh thông qua Email hoặc ID
     * @param {string} studentEmailOrId - Email hoặc Mã học sinh (ID) cần liên kết
     * @returns {Promise<boolean>} Kết quả của thao tác liên kết (true nếu thành công, false nếu thất bại)
     */
    const linkStudent = async (studentEmailOrId) => {
        if (!studentEmailOrId.trim()) {
            toast.error("Vui lòng nhập Email hoặc Mã học sinh (ID).");
            return false;
        }

        try {
            const usersRef = collection(db, "users");
            let studentDoc = null;
            
            const directSnap = await getDoc(doc(db, "users", studentEmailOrId.trim()));
            if (directSnap.exists() && directSnap.data().role === "student") {
                studentDoc = { id: directSnap.id, ...directSnap.data() };
            } else {
                const q = query(usersRef, where("email", "==", studentEmailOrId.trim().toLowerCase()), where("role", "==", "student"));
                const querySnap = await getDocs(q);
                if (!querySnap.empty) {
                    studentDoc = { id: querySnap.docs[0].id, ...querySnap.docs[0].data() };
                }
            }

            if (!studentDoc) {
                toast.error("Không tìm thấy học sinh với thông tin này!");
                return false;
            }

            const parentRef = doc(db, "users", currentUser.uid);
            await updateDoc(parentRef, {
                children: arrayUnion(studentDoc.id)
            });

            const studentRef = doc(db, "users", studentDoc.id);
            await updateDoc(studentRef, {
                linkedParents: arrayUnion(currentUser.uid)
            });

            currentUser.children = [...(currentUser.children || []), studentDoc.id];
            
            toast.success(`Đã liên kết thành công với học sinh: ${studentDoc.name}`);
            mutate();
            return true;
        } catch (error) {
            console.error("Lỗi liên kết:", error);
            toast.error("Có lỗi xảy ra khi liên kết tài khoản.");
            return false;
        }
    };

    return { childrenData: data || [], loading: isLoading, linkStudent, fetchChildren: mutate };
}
