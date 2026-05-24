import { collection, doc, setDoc, getDocs, getDoc, query, where, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const runWithTimeout = (promise, ms = 3000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Hết thời gian chờ phản hồi Firebase")), ms)
        )
    ]);
};

export const studentService = {
    /**
     * Tham gia lớp học bằng Mã lớp
     */
    async joinClassByCode(studentUid, studentName, classCode) {
        if (!classCode || !studentUid) throw new Error("Thiếu mã lớp hoặc ID học sinh");
        
        try {
            // 1. Tìm lớp học theo classCode
            const q = query(collection(db, "classes"), where("classCode", "==", classCode.toUpperCase()));
            const querySnapshot = await runWithTimeout(getDocs(q));
            
            if (querySnapshot.empty) {
                throw new Error("Không tìm thấy lớp học có mã này!");
            }
            
            const classDoc = querySnapshot.docs[0];
            const classId = classDoc.id;
            
            // 2. Kiểm tra xem học sinh đã tham gia lớp này chưa
            const memberId = `${classId}_${studentUid}`;
            const memberRef = doc(db, "class_members", memberId);
            const memberSnap = await runWithTimeout(getDoc(memberRef));
            
            if (memberSnap.exists()) {
                throw new Error("Bạn đã tham gia lớp học này rồi!");
            }
            
            // 3. Thêm học sinh vào collection class_members
            const newMember = {
                id: memberId,
                classId: classId,
                studentId: studentUid,
                studentName: studentName || "Học sinh ẩn danh",
                joinedAt: new Date().toISOString(),
                status: "approved" // Tương lai có thể đổi thành 'pending' nếu cần duyệt
            };
            
            await runWithTimeout(setDoc(memberRef, newMember));
            
            // 4. Cập nhật số lượng học sinh trong lớp
            const currentCount = classDoc.data().studentCount || 0;
            await updateDoc(classDoc.ref, { studentCount: currentCount + 1 });
            
            return { success: true, classData: { id: classId, ...classDoc.data() } };
        } catch (error) {
            console.error("Lỗi joinClassByCode:", error);
            throw error;
        }
    },

    /**
     * Lấy danh sách các lớp học mà học sinh đã tham gia
     */
    async getJoinedClasses(studentUid) {
        if (!studentUid) return [];
        try {
            const q = query(collection(db, "class_members"), where("studentId", "==", studentUid));
            const snapshot = await runWithTimeout(getDocs(q));
            
            if (snapshot.empty) return [];
            
            const classPromises = snapshot.docs.map(async (memberDoc) => {
                const classId = memberDoc.data().classId;
                const classRef = doc(db, "classes", classId);
                const classSnap = await getDoc(classRef);
                if (classSnap.exists()) {
                    return { id: classSnap.id, ...classSnap.data(), joinedAt: memberDoc.data().joinedAt };
                }
                return null;
            });
            
            const classes = await Promise.all(classPromises);
            return classes.filter(c => c !== null);
        } catch (error) {
            console.error("Lỗi getJoinedClasses:", error);
            throw error;
        }
    },

    /**
     * Lấy danh sách học sinh của một lớp (Dành cho Giáo viên)
     */
    async getClassMembers(classId) {
        if (!classId) return [];
        try {
            const q = query(collection(db, "class_members"), where("classId", "==", classId));
            const snapshot = await runWithTimeout(getDocs(q));
            
            const members = [];
            snapshot.forEach((doc) => {
                members.push({ id: doc.id, ...doc.data() });
            });
            return members;
        } catch (error) {
            console.error("Lỗi getClassMembers:", error);
            throw error;
        }
    }
};
