import { collection, doc, setDoc, getDocs, getDoc, updateDoc, query, where, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const encouragementService = {
    /**
     * Gửi một lời chúc từ phụ huynh tới học sinh
     * @param {string} studentId - ID của học sinh nhận
     * @param {string} parentName - Tên người gửi (phụ huynh)
     * @param {string} message - Nội dung lời động viên
     * @param {string} sticker - ID của sticker (trophy, star, heart, v.v.)
     */
    async sendEncouragement(studentId, parentName, message, sticker) {
        if (!studentId) throw new Error("Missing studentId");
        
        try {
            const encouragementsRef = collection(db, `users/${studentId}/encouragements`);
            const newDocRef = doc(encouragementsRef);
            
            await setDoc(newDocRef, {
                id: newDocRef.id,
                parentName: parentName || "Phụ huynh",
                message: message,
                sticker: sticker || "heart",
                status: "unread",
                createdAt: serverTimestamp(),
            });
            
            return { success: true, id: newDocRef.id };
        } catch (error) {
            console.error("Error sending encouragement:", error);
            throw error;
        }
    },

    /**
     * Đánh dấu lời chúc là đã đọc
     * @param {string} studentId 
     * @param {string} encouragementId 
     */
    async markAsRead(studentId, encouragementId) {
        if (!studentId || !encouragementId) return;
        
        try {
            const docRef = doc(db, `users/${studentId}/encouragements`, encouragementId);
            await updateDoc(docRef, {
                status: "read",
                readAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error marking encouragement as read:", error);
        }
    },

    /**
     * Lấy danh sách lời chúc (có thể dùng cho lịch sử)
     * @param {string} studentId 
     */
    async getEncouragements(studentId) {
        if (!studentId) return [];
        try {
            const q = query(collection(db, `users/${studentId}/encouragements`));
            const snap = await getDocs(q);
            return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => {
                // sort descending by timestamp
                const timeA = a.createdAt?.toMillis() || 0;
                const timeB = b.createdAt?.toMillis() || 0;
                return timeB - timeA;
            });
        } catch (error) {
            console.error("Error fetching encouragements:", error);
            return [];
        }
    },

    /**
     * Lắng nghe lời chúc mới (Real-time listener)
     * @param {string} studentId 
     * @param {function} callback - callback function(unreadEncouragements)
     * @returns {function} unsubscribe function
     */
    listenForUnread(studentId, callback) {
        if (!studentId) return () => {};
        
        const q = query(
            collection(db, `users/${studentId}/encouragements`),
            where("status", "==", "unread")
        );
        
        return onSnapshot(q, (snapshot) => {
            const unreadList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(unreadList);
        });
    }
};
