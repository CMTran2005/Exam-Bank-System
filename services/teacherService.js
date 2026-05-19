import { collection, query, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const runWithTimeout = (promise, ms = 2000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Hết thời gian chờ phản hồi Firebase")), ms)
        )
    ]);
};

export const teacherService = {
    /**
     * Lấy danh sách giáo viên có trên hệ thống (mô phỏng từ bảng exams)
     */
    async getTeachers(currentUid) {
        try {
            const q = query(collection(db, "exams"), limit(100));
            const querySnapshot = await runWithTimeout(getDocs(q));

            const uniqueAuthors = new Map();
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.uid && data.uid !== currentUid && data.author) {
                    if (!uniqueAuthors.has(data.uid)) {
                        uniqueAuthors.set(data.uid, {
                            id: data.uid,
                            name: data.author,
                            subject: data.subject || "Giáo viên",
                            examsCount: 1,
                            avatar: data.author.charAt(0).toUpperCase(),
                            color: ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500", "bg-rose-500"][Math.floor(Math.random() * 5)],
                            role: "Thành viên"
                        });
                    } else {
                        const t = uniqueAuthors.get(data.uid);
                        t.examsCount += 1;
                    }
                }
            });
            return Array.from(uniqueAuthors.values());
        } catch (error) {
            console.warn("Lỗi fetch getTeachers:", error);
            throw error;
        }
    }
};
