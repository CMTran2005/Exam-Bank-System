"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, User, Phone, GraduationCap, School, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { GRADE_SUBJECTS_MAP } from "@/lib/constants";

export default function StudentSettingsPage() {
    const { currentUser, setCurrentUser, loading } = useAuth();
    const router = useRouter();

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [grade, setGrade] = useState("");
    const [school, setSchool] = useState("");
    
    const [saving, setSaving] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);

    useEffect(() => {
        if (!loading && !currentUser) {
            router.push("/login");
        } else if (currentUser) {
            setName(currentUser.name || "");
            setPhone(currentUser.phone || "");
            
            setGrade(currentUser.grade ? String(currentUser.grade) : "");
            setSchool((currentUser.school && currentUser.school !== "Chưa cập nhật") ? currentUser.school : "");
        }
    }, [currentUser, loading, router]);

    const rawGrade = (grade || "").trim().normalize("NFC");
    const GRADE_KEYS = Object.keys(GRADE_SUBJECTS_MAP);
    let safeGrade = "";
    if (GRADE_KEYS.includes(rawGrade)) {
        safeGrade = rawGrade;
    } else if (rawGrade) {
        const sortedKeys = [...GRADE_KEYS].sort((a,b) => b.length - a.length);
        const match = sortedKeys.find(k => 
            rawGrade.includes(k) || 
            k.localeCompare(rawGrade, undefined, { sensitivity: 'base' }) === 0 ||
            rawGrade.replace(/\D/g, '') === k
        );
        if (match) safeGrade = match;
    }

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSavedSuccess(false);

        try {
            const userRef = doc(db, "users", currentUser.uid);
            const updateData = {
                name,
                phone,
                grade,
                school,
                updatedAt: new Date().toISOString()
            };

            await setDoc(userRef, updateData, { merge: true });

            const updatedUser = { ...currentUser, ...updateData };
            setCurrentUser(updatedUser);
            localStorage.setItem("eb_user", JSON.stringify(updatedUser));
            
            toast.success("Đã cập nhật thông tin thành công!");
            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 3000);
        } catch (error) {
            console.error("Lỗi cập nhật thông tin:", error);
            toast.error("Có lỗi xảy ra, vui lòng thử lại sau!");
        } finally {
            setSaving(false);
        }
    };

    if (loading || !currentUser) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Tiêu đề trang */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                        <span className="w-2.5 h-6 bg-primary rounded-full" />
                        Hồ Sơ Học Sinh
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">Cập nhật thông tin cá nhân của bạn</p>
                </div>
            </div>

            <div className="bg-card border border-border shadow-sm rounded-2xl p-5 sm:p-8">
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Họ và tên */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Họ và Tên <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="pl-10 font-medium"
                                    placeholder="Ví dụ: Nguyễn Văn A"
                                />
                            </div>
                        </div>

                        {/* Email (Read-only) */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Địa chỉ Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    disabled
                                    value={currentUser?.email || ""}
                                    className="pl-10 font-medium bg-muted/50 cursor-not-allowed opacity-80"
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground">Email dùng để đăng nhập, không thể thay đổi.</p>
                        </div>

                        {/* Số điện thoại */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Số điện thoại
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="pl-10 font-medium"
                                    placeholder="Ví dụ: 0912345678"
                                />
                            </div>
                        </div>

                        {/* Khối lớp */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Khối Lớp
                            </label>
                            <div className="relative">
                                <div className="absolute left-3.5 top-3 z-10 pointer-events-none">
                                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <Select key={safeGrade || "none"} value={safeGrade || "none"} onValueChange={setGrade}>
                                    <SelectTrigger className="pl-10 h-10 border-input bg-background font-medium focus:ring-primary">
                                        <SelectValue placeholder="-- Chọn khối lớp --" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none" className="hidden">-- Chọn khối lớp --</SelectItem>
                                        {Object.keys(GRADE_SUBJECTS_MAP).map(g => (
                                            <SelectItem key={g} value={g}>
                                                {g === "Đại học" ? "Đại học" : `Khối ${g}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Trường học */}
                        <div className="space-y-2 sm:col-span-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Trường Học
                            </label>
                            <div className="relative">
                                <School className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={school}
                                    onChange={(e) => setSchool(e.target.value)}
                                    className="pl-10 font-medium"
                                    placeholder="Chưa cập nhật"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Thanh hành động cuối Form & Toast thông báo thành công */}
                    <div className="pt-6 mt-4 border-t border-border flex items-center justify-between gap-4">
                        {savedSuccess ? (
                            <div className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in">
                                <CheckCircle className="w-4 h-4 mr-1.5 shrink-0" />
                                Lưu thông tin thành công!
                            </div>
                        ) : (
                            <div />
                        )}
                        <Button
                            type="submit"
                            disabled={saving}
                            className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl h-10 px-8 shrink-0 shadow-lg shadow-primary/10 transition-all active:scale-[0.98]"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                "Lưu Thay Đổi"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
