import useSWR from "swr";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { studentService } from "@/services/studentService";

/**
 * Hook tùy chỉnh để lấy dữ liệu báo cáo học tập của một học sinh cụ thể.
 * Dành cho phụ huynh theo dõi tiến độ và điểm số của con em.
 * 
 * @param {Object} currentUser - Đối tượng người dùng (phụ huynh) hiện tại
 * @param {string} studentId - ID của học sinh cần xem báo cáo
 * @param {Object} router - Đối tượng router từ next/navigation để điều hướng
 * @returns {Object} Đối tượng chứa dữ liệu học sinh, lớp học, lịch sử thi, dữ liệu biểu đồ và trạng thái tải
 */
export function useStudentReport(currentUser, studentId, router) {
    /**
     * Hàm lấy và tổng hợp dữ liệu báo cáo từ Firestore
     * @param {string} id - ID của học sinh
     * @returns {Promise<Object>} Dữ liệu báo cáo tổng hợp bao gồm thông tin học sinh, lớp học, lịch sử làm bài, biểu đồ radar và xu hướng
     */
    const fetcher = async (id) => {
        let studentData = null;
        const studentSnap = await getDoc(doc(db, "users", id));
        if (studentSnap.exists()) {
            studentData = { id: studentSnap.id, ...studentSnap.data() };
        }

        const studentClasses = await studentService.getJoinedClasses(id);
        const classes = studentClasses || [];

        const attemptsQuery = query(
            collection(db, "exam_attempts"),
            where("studentId", "==", id)
        );
        const attemptsSnap = await getDocs(attemptsQuery);
        const attempts = attemptsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
                const timeA = a.startTime ? Date.parse(a.startTime) : 0;
                const timeB = b.startTime ? Date.parse(b.startTime) : 0;
                return timeB - timeA;
            });

        let total = 0;
        let count = 0;
        const subjectDataMap = {};

        attempts.forEach(a => {
            if (a.score !== null && a.score !== undefined) {
                const score = parseFloat(a.score);
                total += score;
                count++;

                let sub = "Khác";
                if (a.classId === "practice") sub = "Tự do";
                else {
                    const matched = classes.find(c => c.id === a.classId);
                    if (matched) sub = matched.subject || "Khác";
                }
                if (!subjectDataMap[sub]) subjectDataMap[sub] = { name: sub, total: 0, count: 0 };
                subjectDataMap[sub].total += score;
                subjectDataMap[sub].count++;
            }
        });

        const scoredAttempts = attempts.filter(a => a.score !== null && a.score !== undefined && a.status === "completed");
        let trendData = [];
        
        if (scoredAttempts.length > 0) {
            const dailyData = {};
            let minDate = new Date();
            let maxDate = new Date("2000-01-01");
            
            scoredAttempts.forEach(a => {
                const d = new Date(a.startTime);
                d.setHours(0, 0, 0, 0);
                
                if (d < minDate) minDate = new Date(d);
                if (d > maxDate) maxDate = new Date(d);
                
                const dateStr = d.getTime();
                if (!dailyData[dateStr]) {
                    dailyData[dateStr] = { totalScore: 0, count: 0 };
                }
                dailyData[dateStr].totalScore += parseFloat(a.score);
                dailyData[dateStr].count += 1;
            });

            const maxDays = 14;
            const diffTime = Math.abs(maxDate - minDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays > maxDays) {
                minDate = new Date(maxDate);
                minDate.setDate(maxDate.getDate() - maxDays + 1);
            }

            let currDate = new Date(minDate);
            while (currDate <= maxDate) {
                const timeKey = currDate.getTime();
                let dailyCount = 0;
                
                if (dailyData[timeKey]) {
                    dailyCount = dailyData[timeKey].count;
                }

                trendData.push({
                    name: `${currDate.getDate()}/${currDate.getMonth() + 1}`,
                    count: dailyCount
                });

                currDate.setDate(currDate.getDate() + 1);
            }
        }

        const radarData = Object.values(subjectDataMap).map(s => ({
            subject: s.name,
            score: parseFloat((s.total / s.count).toFixed(1))
        }));

        const avgScore = count > 0 ? (total / count).toFixed(1) : 0;

        return { studentData, classes, attempts, radarData, trendData, avgScore };
    };

    // Verify parent-child access permissions
    const isValid = currentUser && currentUser.children && currentUser.children.includes(studentId);
    
    useEffect(() => {
        if (currentUser && !isValid) {
            router.push("/parent");
        }
    }, [currentUser, isValid, router]);

    const { data, error, isLoading } = useSWR(
        isValid ? `student_report_${studentId}` : null,
        () => fetcher(studentId),
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000,
        }
    );

    return { 
        studentData: data?.studentData || null, 
        classes: data?.classes || [], 
        attempts: data?.attempts || [], 
        radarData: data?.radarData || [], 
        trendData: data?.trendData || [], 
        avgScore: data?.avgScore || 0, 
        loading: isLoading 
    };
}
