import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { classService } from "@/services/classService";

export function useClassDetails(classId) {
    const { currentUser, loading: authLoading } = useAuth();
    const router = useRouter();
    
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [students, setStudents] = useState([]);
    const [classDetails, setClassDetails] = useState(null);

    useEffect(() => {
        if (!authLoading && !currentUser) {
            router.push("/login");
            return;
        }
        
        let unsubscribe = null;

        if (currentUser) {
            import("firebase/firestore").then(({ doc, onSnapshot }) => {
                import("@/lib/firebase").then(({ db }) => {
                    const docRef = doc(db, "classes", classId);
                    unsubscribe = onSnapshot(docRef, (docSnap) => {
                        if (docSnap.exists()) {
                            const data = { id: docSnap.id, ...docSnap.data() };
                            setClassDetails(data);
                            
                            if (data.students) {
                                // Duy trì trạng thái điểm danh hiện tại nếu có, hoặc set mặc định là pending
                                setStudents(prevStudents => {
                                    const prevStatusMap = {};
                                    prevStudents.forEach(s => prevStatusMap[s.id] = s.attendance);
                                    
                                    return data.students.map(s => ({
                                        ...s,
                                        attendance: prevStatusMap[s.id] || "pending"
                                    }));
                                });
                            }
                        }
                        setLoading(false);
                    }, (error) => {
                        console.error("Lỗi onSnapshot class:", error);
                        setLoading(false);
                    });
                });
            });
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [currentUser, authLoading, router, classId]);

    const toggleAttendance = (studentId) => {
        setStudents(students.map(s => {
            if (s.id === studentId) {
                const nextStatus = s.attendance === "pending" ? "present" : s.attendance === "present" ? "absent" : "pending";
                return { ...s, attendance: nextStatus };
            }
            return s;
        }));
    };

    const filteredStudents = students.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return {
        authLoading, loading,
        classDetails, students, filteredStudents,
        searchQuery, setSearchQuery,
        toggleAttendance
    };
}
