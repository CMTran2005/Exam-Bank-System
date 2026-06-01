"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, Plus, UserPlus, GraduationCap, Clock, Award, Activity, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function ParentDashboard() {
    const { currentUser } = useAuth();
    const router = useRouter();
    const [childrenData, setChildrenData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [studentEmailOrId, setStudentEmailOrId] = useState("");
    const [linking, setLinking] = useState(false);

    const fetchChildren = async () => {
        if (!currentUser?.children || currentUser.children.length === 0) {
            setChildrenData([]);
            setLoading(false);
            return;
        }

        try {
            const data = [];
            for (const childId of currentUser.children) {
                const childSnap = await getDoc(doc(db, "users", childId));
                if (childSnap.exists()) {
                    // Fetch thêm dữ liệu học tập của học sinh này (ví dụ: điểm trung bình, số bài đã làm)
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
            setChildrenData(data);
        } catch (error) {
            console.error("Lỗi khi tải thông tin con cái:", error);
            toast.error("Không thể tải thông tin con cái.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchChildren();
        }
    }, [currentUser]);

    const handleLinkStudent = async () => {
        if (!studentEmailOrId.trim()) {
            toast.error("Vui lòng nhập Email hoặc Mã học sinh (ID).");
            return;
        }

        setLinking(true);
        try {
            // Tìm học sinh theo email hoặc ID
            const usersRef = collection(db, "users");
            let studentDoc = null;
            
            // 1. Tìm theo ID
            const directSnap = await getDoc(doc(db, "users", studentEmailOrId.trim()));
            if (directSnap.exists() && directSnap.data().role === "student") {
                studentDoc = { id: directSnap.id, ...directSnap.data() };
            } else {
                // 2. Tìm theo Email
                const q = query(usersRef, where("email", "==", studentEmailOrId.trim().toLowerCase()), where("role", "==", "student"));
                const querySnap = await getDocs(q);
                if (!querySnap.empty) {
                    studentDoc = { id: querySnap.docs[0].id, ...querySnap.docs[0].data() };
                }
            }

            if (!studentDoc) {
                toast.error("Không tìm thấy học sinh với thông tin này!");
                setLinking(false);
                return;
            }

            // Liên kết: Cập nhật tài khoản Parent
            const parentRef = doc(db, "users", currentUser.uid);
            await updateDoc(parentRef, {
                children: arrayUnion(studentDoc.id)
            });

            // Cập nhật tài khoản Student
            const studentRef = doc(db, "users", studentDoc.id);
            await updateDoc(studentRef, {
                linkedParents: arrayUnion(currentUser.uid)
            });

            // Cập nhật state nội bộ
            currentUser.children = [...(currentUser.children || []), studentDoc.id];
            
            toast.success(`Đã liên kết thành công với học sinh: ${studentDoc.name}`);
            setIsLinkModalOpen(false);
            setStudentEmailOrId("");
            fetchChildren();
        } catch (error) {
            console.error("Lỗi liên kết:", error);
            toast.error("Có lỗi xảy ra khi liên kết tài khoản.");
        } finally {
            setLinking(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-emerald-500" />
                        Trang chủ Phụ Huynh
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Quản lý và theo dõi tiến độ học tập của các con.</p>
                </div>
                <Button onClick={() => setIsLinkModalOpen(true)} className="bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/20 rounded-xl gap-2 font-bold">
                    <UserPlus className="w-4 h-4" /> Liên kết Tài khoản Con
                </Button>
            </div>

            {childrenData.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {childrenData.map(child => (
                        <div key={child.id} className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                            <div className="bg-gradient-to-r from-sky-500 to-indigo-500 h-24 relative">
                                <div className="absolute -bottom-10 left-6">
                                    <div className="w-20 h-20 rounded-full border-4 border-card shadow-lg bg-sky-50 overflow-hidden flex items-center justify-center text-2xl font-black text-sky-600">
                                        {child.photoURL ? (
                                            <img src={child.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            child.name?.charAt(0) || "H"
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-12 pb-6 px-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-xl font-black text-foreground">{child.name}</h3>
                                        <p className="text-xs text-muted-foreground font-medium">{child.email}</p>
                                    </div>
                                    <span className="bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 text-xs font-bold px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800">
                                        {child.grade ? `Lớp ${child.grade}` : "Chưa cập nhật lớp"}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <Award className="w-4 h-4 text-amber-500" />
                                            <span className="text-xs font-bold uppercase">Điểm Trung Bình</span>
                                        </div>
                                        <p className="text-2xl font-black text-foreground">{child.avgScore} <span className="text-sm font-medium text-muted-foreground/70">/10</span></p>
                                    </div>
                                    <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <Activity className="w-4 h-4 text-emerald-500" />
                                            <span className="text-xs font-bold uppercase">Bài Thi Đã Làm</span>
                                        </div>
                                        <p className="text-2xl font-black text-foreground">{child.examsTaken} <span className="text-sm font-medium text-muted-foreground/70">đề thi</span></p>
                                    </div>
                                </div>

                                <Button 
                                    onClick={() => router.push(`/parent/student/${child.id}`)}
                                    className="w-full rounded-xl font-bold"
                                >
                                    Xem Báo Cáo Học Tập Chi Tiết
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-card border border-dashed border-border rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                        <GraduationCap className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">Chưa có học sinh nào được liên kết</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
                            Bạn cần liên kết tài khoản với con mình để có thể theo dõi biểu đồ điểm số, số giờ làm bài và nhận báo cáo học tập định kỳ.
                        </p>
                    </div>
                    <Button onClick={() => setIsLinkModalOpen(true)} className="bg-sky-500 hover:bg-sky-600 text-white mt-4 rounded-xl">
                        Liên kết ngay
                    </Button>
                </div>
            )}

            <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Search className="w-5 h-5 text-sky-500" />
                            Tìm và Liên kết Học sinh
                        </DialogTitle>
                        <DialogDescription>
                            Nhập Email hoặc Mã định danh (ID) của con bạn để gửi yêu cầu liên kết theo dõi học tập.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-4">
                        <label className="text-sm font-bold text-foreground mb-2 block">Email hoặc Mã ID</label>
                        <Input 
                            placeholder="ví dụ: hocsinh@gmail.com hoặc mã ID" 
                            value={studentEmailOrId}
                            onChange={(e) => setStudentEmailOrId(e.target.value)}
                            className="bg-background border-border"
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsLinkModalOpen(false)}>Hủy</Button>
                        <Button onClick={handleLinkStudent} disabled={linking} className="bg-sky-500 hover:bg-sky-600 text-white">
                            {linking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Tiến hành Liên kết
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
