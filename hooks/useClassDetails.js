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
        
        if (currentUser) {
            const fetchData = async () => {
                try {
                    const data = await classService.getClassDetails(classId);
                    setClassDetails(data);
                } catch (error) {
                    console.error(error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
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
