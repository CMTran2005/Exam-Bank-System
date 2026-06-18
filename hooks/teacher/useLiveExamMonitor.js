import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useLiveExamMonitor(examId, classId) {
    const [liveAttempts, setLiveAttempts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!classId) return;

        setLoading(true);
        let q;
        if (examId) {
            q = query(
                collection(db, "exam_attempts"),
                where("examId", "==", examId),
                where("classId", "==", classId)
            );
        } else {
            q = query(
                collection(db, "exam_attempts"),
                where("classId", "==", classId)
            );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const attemptsData = [];
            snapshot.forEach((doc) => {
                attemptsData.push({ id: doc.id, ...doc.data() });
            });

            setLiveAttempts(attemptsData);
            setLoading(false);
        }, (error) => {
            console.error("Lỗi lắng nghe live attempts:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [examId]);

    return { liveAttempts, loading };
}
