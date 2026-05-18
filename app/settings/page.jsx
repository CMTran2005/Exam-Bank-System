"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Settings,
    User,
    Sliders,
    Cpu,
    Eye,
    EyeOff,
    CheckCircle,
    Loader2,
    Paintbrush,
    GraduationCap,
    Phone,
    Clock,
    Shuffle,
    FileText,
    Laptop
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "next-themes";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Hàm tiện ích giới hạn thời gian chờ của một tác vụ Promise (tránh bị treo do mạng/DB chưa cấu hình)
const runWithTimeout = (promise, ms = 1000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Hết thời gian chờ phản hồi Firebase")), ms)
        )
    ]);
};

/**
 * @file page.jsx
 * @description Trang Cấu hình Hệ thống (Settings) nâng cao dành cho Giáo viên.
 * Cho phép thiết lập tham số đề thi, kết nối mô hình Google Gemini OCR, điều chỉnh giao diện hiển thị, và hồ sơ sư phạm.
 */
export default function SettingsPage() {
    const { currentUser, setCurrentUser, loading } = useAuth();
    const router = useRouter();
    const { theme: activeTheme, setTheme: setActiveTheme } = useTheme();

    // Bảo vệ định tuyến bằng Auth Guard
    useEffect(() => {
        if (!loading && !currentUser) {
            router.push("/login");
        }
    }, [currentUser, loading, router]);

    // Trạng thái các tab cài đặt
    const [activeTab, setActiveTab] = useState("profile");

    // --- CẤU HÌNH TRẠNG THÁI (STATES) ---
    // 1. Hồ sơ cá nhân sư phạm
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [school, setSchool] = useState("");
    const [phone, setPhone] = useState("");
    const [degree, setDegree] = useState("Thạc sĩ");
    const [mainSubject, setMainSubject] = useState("Toán học");

    // Các trường thông tin bổ sung & Ảnh đại diện Cloudinary
    const [avatarUrl, setAvatarUrl] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [graduationYear, setGraduationYear] = useState("");
    const [graduationGrade, setGraduationGrade] = useState("Chưa tốt nghiệp");
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // 2. Mặc định đề thi & chấm điểm
    const [defaultPoints, setDefaultPoints] = useState("1.0");
    const [pointsStep, setPointsStep] = useState("0.25");
    const [autoNumbering, setAutoNumbering] = useState(true);
    const [duration, setDuration] = useState("90");
    const [shuffleOptions, setShuffleOptions] = useState(true);
    const [headerTitle, setHeaderTitle] = useState("ĐỀ KIỂM TRA CHẤT LƯỢNG HỌC KỲ");

    // 3. Trợ lý AI & OCR nâng cao
    const [geminiKey, setGeminiKey] = useState("••••••••••••••••••••••••••••••••••••");
    const [showKey, setShowKey] = useState(false);
    const [ocrConfidence, setOcrConfidence] = useState("95");
    const [aiModel, setAiModel] = useState("gemini-2.5-flash");
    const [autoTranslate, setAutoTranslate] = useState(false);

    // 4. Giao diện & Hiển thị công thức
    const [theme, setTheme] = useState("system");
    const [fontSize, setFontSize] = useState("14");
    const [latexMode, setLatexMode] = useState("inline");

    // Trạng thái nút bấm lưu cấu hình
    const [saving, setSaving] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);

    // Đọc cấu hình đã lưu trữ từ LocalStorage và Firebase khi khởi tạo component
    useEffect(() => {
        if (currentUser) {
            console.log("DEBUG: SettingsPage useEffect currentUser:", currentUser);
            setName(currentUser.name || "");
            setEmail(currentUser.email || "");
            setSchool(currentUser.school || "");
            setPhone(currentUser.phone || "");

            // Chuẩn hóa & tải học vị từ currentUser làm mặc định (NFC Normalization)
            let loadedDegree = (currentUser.degree || "Thạc sĩ").normalize("NFC");
            console.log("DEBUG: currentUser.degree:", currentUser.degree, "-> loadedDegree (NFC):", loadedDegree);
            if (loadedDegree === "Cử nhân") loadedDegree = "Cử nhân (Đại học)";
            if (loadedDegree === "Kĩ sư") loadedDegree = "Kĩ sư (Đại học)";

            // Chuẩn hóa & tải môn học chính từ currentUser làm mặc định (NFC Normalization)
            let loadedSubject = (currentUser.mainSubject || "Toán học").normalize("NFC");
            if (loadedSubject === "Khoa học máy tính") loadedSubject = "Khoa học máy tính (CS)";
            if (loadedSubject === "Kỹ thuật phần mềm") loadedSubject = "Kỹ thuật phần mềm (SE)";
            if (loadedSubject === "Công nghệ thông tin") loadedSubject = "Công nghệ thông tin (IT)";

            setAvatarUrl(currentUser.avatarUrl || "");
            setBirthDate(currentUser.birthDate || "");
            setGraduationYear(currentUser.graduationYear || "");
            setGraduationGrade(currentUser.graduationGrade || "Chưa tốt nghiệp");

            const savedSettings = localStorage.getItem("eb_system_settings");
            if (savedSettings) {
                try {
                    const parsed = JSON.parse(savedSettings);
                    if (parsed.phone) setPhone(parsed.phone);

                    if (parsed.degree) {
                        let d = parsed.degree.normalize("NFC");
                        if (d === "Cử nhân") d = "Cử nhân (Đại học)";
                        if (d === "Kĩ sư") d = "Kĩ sư (Đại học)";
                        loadedDegree = d;
                    }

                    if (parsed.mainSubject) {
                        let s = parsed.mainSubject.normalize("NFC");
                        if (s === "Khoa học máy tính") s = "Khoa học máy tính (CS)";
                        if (s === "Kỹ thuật phần mềm") s = "Kỹ thuật phần mềm (SE)";
                        if (s === "Công nghệ thông tin") s = "Công nghệ thông tin (IT)";
                        loadedSubject = s;
                    }

                    if (parsed.defaultPoints) setDefaultPoints(parsed.defaultPoints);
                    if (parsed.pointsStep) setPointsStep(parsed.pointsStep);
                    if (parsed.autoNumbering !== undefined) setAutoNumbering(parsed.autoNumbering);
                    if (parsed.duration) setDuration(parsed.duration);
                    if (parsed.shuffleOptions !== undefined) setShuffleOptions(parsed.shuffleOptions);
                    if (parsed.headerTitle) setHeaderTitle(parsed.headerTitle);
                    if (parsed.geminiKey) setGeminiKey(parsed.geminiKey);
                    if (parsed.ocrConfidence) setOcrConfidence(parsed.ocrConfidence);
                    if (parsed.aiModel) setAiModel(parsed.aiModel);
                    if (parsed.autoTranslate !== undefined) setAutoTranslate(parsed.autoTranslate);
                    if (parsed.theme) setTheme(parsed.theme);
                    if (parsed.fontSize) setFontSize(parsed.fontSize);
                    if (parsed.latexMode) setLatexMode(parsed.latexMode);
                } catch (e) {
                    console.error("Lỗi đọc cấu hình lưu trữ:", e);
                }
            }

            console.log("DEBUG: Final resolved values to set in state (Normalized):", { loadedDegree, loadedSubject });
            // Gán các giá trị đã qua chuẩn hóa vào state
            setDegree(loadedDegree);
            setMainSubject(loadedSubject);
        }
    }, [currentUser]);

    // Xử lý tải ảnh đại diện lên Cloudinary
    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("Kích thước tệp tin phải nhỏ hơn 2MB!");
            return;
        }

        setUploadingAvatar(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "exam_bank_preset");

        try {
            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dfseun0dm";
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: "POST",
                body: formData
            });

            if (!res.ok) throw new Error("Không thể tải ảnh lên Cloudinary");

            const data = await res.json();
            if (data.secure_url) {
                setAvatarUrl(data.secure_url);
            }
        } catch (error) {
            console.error("Lỗi tải avatar:", error);
            alert("Có lỗi xảy ra trong quá trình tải ảnh đại diện lên Cloudinary!");
        } finally {
            setUploadingAvatar(false);
        }
    };

    // Xử lý lưu cấu hình hệ thống
    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSavedSuccess(false);

        const newSettings = {
            phone,
            degree,
            mainSubject,
            defaultPoints,
            pointsStep,
            autoNumbering,
            duration,
            shuffleOptions,
            headerTitle,
            geminiKey,
            ocrConfidence,
            aiModel,
            autoTranslate,
            theme,
            fontSize,
            latexMode
        };

        // Lưu trữ cấu hình dạng JSON và các khóa tiện ích riêng lẻ
        localStorage.setItem("eb_system_settings", JSON.stringify(newSettings));
        localStorage.setItem("eb_theme", theme);
        localStorage.setItem("eb_font_size", fontSize);

        // Kích hoạt theme mới thông qua next-themes
        setActiveTheme(theme);

        // Cập nhật lại thông tin tài khoản người dùng hiện tại
        if (currentUser) {
            const updatedUser = {
                ...currentUser,
                name,
                school,
                phone,
                degree,
                mainSubject,
                avatarUrl,
                birthDate,
                graduationYear,
                graduationGrade
            };

            // ĐỒNG BỘ TRỰC TIẾP LÊN FIREBASE FIRESTORE (Yêu cầu đề bài)
            try {
                const userDocRef = doc(db, "users", currentUser.uid);
                await runWithTimeout(setDoc(userDocRef, updatedUser), 1000);
            } catch (err) {
                console.warn("Bỏ qua lỗi Firestore khi cập nhật hồ sơ cá nhân:", err.message);
            }

            localStorage.setItem("eb_user", JSON.stringify(updatedUser));
            setCurrentUser(updatedUser);
        }

        setTimeout(() => {
            setSaving(false);
            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 2500);
        }, 800);
    };

    // Hiển thị loading spinner trong khi xác thực định tuyến
    if (loading || !currentUser) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
            {/* Tiêu đề trang */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                        <span className="w-2.5 h-6 bg-primary rounded-full" />
                        Cấu Hình Hệ Thống
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">Cá nhân hóa tài khoản và thiết lập các thông số nâng cao</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                {/* Thanh Menu điều hướng Tabs bên trái */}
                <div className="md:col-span-1 bg-card border border-border shadow-sm rounded-2xl p-2 flex flex-row md:flex-col gap-1 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab("profile")}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${activeTab === "profile"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                    >
                        <User className="w-4 h-4 shrink-0" />
                        <span>Hồ sơ cá nhân</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("exam")}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${activeTab === "exam"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                    >
                        <Sliders className="w-4 h-4 shrink-0" />
                        <span>Mặc định đề thi</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("ai")}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${activeTab === "ai"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                    >
                        <Cpu className="w-4 h-4 shrink-0" />
                        <span>Trợ lý AI & OCR</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("display")}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${activeTab === "display"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                    >
                        <Paintbrush className="w-4 h-4 shrink-0" />
                        <span>Hiển thị & Giao diện</span>
                    </button>
                </div>

                {/* Khung nội dung Cấu hình bên phải */}
                <div className="md:col-span-3 bg-card border border-border shadow-sm rounded-2xl p-5 sm:p-6">
                    <form onSubmit={handleSave} className="space-y-6">

                        {/* TAB 1: HỒ SƠ GIÁO VIÊN */}
                        {activeTab === "profile" && (
                            <div className="space-y-4">
                                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider pb-2 border-b border-border/60 flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-primary" />
                                    Thông tin giáo viên
                                </h2>

                                {/* Khu vực thay đổi ảnh đại diện (Cloudinary Integration) */}
                                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border border-border/80 bg-muted/10">
                                    <div className="relative group w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 shadow-md flex items-center justify-center bg-muted shrink-0">
                                        {avatarUrl ? (
                                            <img
                                                src={avatarUrl}
                                                alt="Avatar"
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        ) : (
                                            <span className="text-xl font-bold text-muted-foreground uppercase">
                                                {name ? name.substring(0, 1) : "G"}
                                            </span>
                                        )}
                                        {uploadingAvatar && (
                                            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-10">
                                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 text-center sm:text-left space-y-1">
                                        <p className="text-xs font-bold text-foreground">Ảnh đại diện Giáo viên</p>
                                        <p className="text-[10px] text-muted-foreground">Tải ảnh mới từ máy tính của bạn. Lưu trữ điện toán đám mây an toàn qua Cloudinary.</p>
                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                                            <label className="cursor-pointer">
                                                <span className="inline-flex items-center justify-center h-8 px-3 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/95 rounded-lg transition-colors shadow-sm">
                                                    Chọn ảnh...
                                                </span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleAvatarChange}
                                                    className="hidden"
                                                    disabled={uploadingAvatar}
                                                />
                                            </label>
                                            {avatarUrl && (
                                                <button
                                                    type="button"
                                                    onClick={() => setAvatarUrl("")}
                                                    className="h-8 px-3 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-200 dark:border-red-950/40 rounded-lg transition-colors"
                                                >
                                                    Xóa ảnh
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground">Họ và tên</label>
                                        <Input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="h-10 border-border"
                                            placeholder="Nguyễn Văn A"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground">Địa chỉ Email</label>
                                        <Input
                                            type="email"
                                            value={email}
                                            className="h-10 border-border bg-muted/40 text-muted-foreground"
                                            disabled
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground">Tên trường / Đơn vị công tác</label>
                                        <Input
                                            value={school}
                                            onChange={(e) => setSchool(e.target.value)}
                                            className="h-10 border-border"
                                            placeholder="THPT Chuyên Quốc Học"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground">Số điện thoại liên hệ</label>
                                        <Input
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="h-10 border-border"
                                            placeholder="09XXXXXXXX"
                                        />
                                    </div>
                                </div>

                                {/* Các trường thông tin bổ sung tùy chỉnh */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground">Ngày tháng năm sinh</label>
                                        <Input
                                            type="date"
                                            value={birthDate}
                                            onChange={(e) => setBirthDate(e.target.value)}
                                            className="h-10 border-border bg-background"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground">Thời gian tốt nghiệp</label>
                                        <Input
                                            type="text"
                                            value={graduationYear}
                                            onChange={(e) => setGraduationYear(e.target.value)}
                                            className="h-10 border-border bg-background"
                                            placeholder="Năm hoặc tháng/năm tốt nghiệp"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground">Tốt nghiệp loại</label>
                                        <Select value={graduationGrade} onValueChange={setGraduationGrade}>
                                            <SelectTrigger className="h-10 border-border bg-background">
                                                <SelectValue placeholder="Chọn xếp loại" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Chưa tốt nghiệp">Chưa tốt nghiệp (Đang học / Cộng tác viên)</SelectItem>
                                                <SelectItem value="Trung bình">Trung bình</SelectItem>
                                                <SelectItem value="Khá">Khá</SelectItem>
                                                <SelectItem value="Giỏi">Giỏi</SelectItem>
                                                <SelectItem value="Xuất sắc">Xuất sắc</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground">Học hàm / Học vị</label>
                                        <Select value={degree} onValueChange={setDegree}>
                                            <SelectTrigger className="h-10 border-border bg-background">
                                                <SelectValue placeholder="Chọn học vị" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={"Cộng tác viên".normalize("NFC")}>Cộng tác viên</SelectItem>
                                                <SelectItem value={"Cử nhân (Đại học)".normalize("NFC")}>Cử nhân (Đại học)</SelectItem>
                                                <SelectItem value={"Kĩ sư (Đại học)".normalize("NFC")}>Kĩ sư (Đại học)</SelectItem>
                                                <SelectItem value={"Thạc sĩ".normalize("NFC")}>Thạc sĩ</SelectItem>
                                                <SelectItem value={"Tiến sĩ".normalize("NFC")}>Tiến sĩ</SelectItem>
                                                <SelectItem value={"Phó Giáo sư".normalize("NFC")}>Phó Giáo sư</SelectItem>
                                                <SelectItem value={"Giáo sư".normalize("NFC")}>Giáo sư</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground">Môn học giảng dạy chính</label>
                                        <Select value={mainSubject} onValueChange={setMainSubject}>
                                            <SelectTrigger className="h-10 border-border bg-background">
                                                <SelectValue placeholder="Chọn môn học chính" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {/* Phổ thông */}
                                                <SelectItem value={"Toán học".normalize("NFC")}>Toán học</SelectItem>
                                                <SelectItem value={"Vật lý".normalize("NFC")}>Vật lý</SelectItem>
                                                <SelectItem value={"Hóa học".normalize("NFC")}>Hóa học</SelectItem>
                                                <SelectItem value={"Sinh học".normalize("NFC")}>Sinh học</SelectItem>
                                                <SelectItem value={"Ngữ văn".normalize("NFC")}>Ngữ văn</SelectItem>
                                                <SelectItem value={"Tiếng Anh".normalize("NFC")}>Tiếng Anh</SelectItem>
                                                <SelectItem value={"Lịch sử".normalize("NFC")}>Lịch sử</SelectItem>
                                                <SelectItem value={"Địa lý".normalize("NFC")}>Địa lý</SelectItem>
                                                <SelectItem value={"Tin học".normalize("NFC")}>Tin học</SelectItem>
                                                {/* Đại học / Chuyên ngành */}
                                                <SelectItem value={"Khoa học máy tính (CS)".normalize("NFC")}>Khoa học máy tính (CS)</SelectItem>
                                                <SelectItem value={"Kỹ thuật phần mềm (SE)".normalize("NFC")}>Kỹ thuật phần mềm (SE)</SelectItem>
                                                <SelectItem value={"Công nghệ thông tin (IT)".normalize("NFC")}>Công nghệ thông tin (IT)</SelectItem>
                                                <SelectItem value={"Kỹ thuật Điện - Điện tử".normalize("NFC")}>Kỹ thuật Điện - Điện tử</SelectItem>
                                                <SelectItem value={"Kỹ thuật Cơ khí - Chế tạo máy".normalize("NFC")}>Kỹ thuật Cơ khí - Chế tạo máy</SelectItem>
                                                <SelectItem value={"Kỹ thuật Xây dựng".normalize("NFC")}>Kỹ thuật Xây dựng</SelectItem>
                                                <SelectItem value={"Kế toán - Kiểm toán".normalize("NFC")}>Kế toán - Kiểm toán</SelectItem>
                                                <SelectItem value={"Quản trị kinh doanh".normalize("NFC")}>Quản trị kinh doanh</SelectItem>
                                                <SelectItem value={"Tài chính - Ngân hàng".normalize("NFC")}>Tài chính - Ngân hàng</SelectItem>
                                                <SelectItem value={"Luật học".normalize("NFC")}>Luật học</SelectItem>
                                                <SelectItem value={"Y khoa - Dược học".normalize("NFC")}>Y khoa - Dược học</SelectItem>
                                                <SelectItem value={"Ngoại thương - Kinh tế đối ngoại".normalize("NFC")}>Ngoại thương - Kinh tế đối ngoại</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: THAM SỐ MẶC ĐỊNH ĐỀ THI */}
                        {activeTab === "exam" && (
                            <div className="space-y-4">
                                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider pb-2 border-b border-border/60 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" />
                                    Tham số mặc định đề thi
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground">Điểm mặc định mỗi câu hỏi</label>
                                        <Input
                                            type="number"
                                            step="0.25"
                                            value={defaultPoints}
                                            onChange={(e) => setDefaultPoints(e.target.value)}
                                            className="h-10 border-border"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground">Bước nhảy tăng điểm (step)</label>
                                        <Input
                                            type="number"
                                            step="0.05"
                                            value={pointsStep}
                                            onChange={(e) => setPointsStep(e.target.value)}
                                            className="h-10 border-border"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground">Thời gian làm bài mặc định</label>
                                        <Select value={duration} onValueChange={setDuration}>
                                            <SelectTrigger className="h-10 border-border bg-background">
                                                <SelectValue placeholder="Chọn thời gian" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="15">15 phút (Kiểm tra nhanh)</SelectItem>
                                                <SelectItem value="45">45 phút (Kiểm tra 1 tiết)</SelectItem>
                                                <SelectItem value="60">60 phút (Kiểm tra học kỳ)</SelectItem>
                                                <SelectItem value="90">90 phút (Thi thử THPT QG)</SelectItem>
                                                <SelectItem value="120">120 phút (Thi chuyên/Đại học)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground">Tiêu đề đầu trang đề thi mặc định</label>
                                        <Input
                                            value={headerTitle}
                                            onChange={(e) => setHeaderTitle(e.target.value)}
                                            className="h-10 border-border"
                                            placeholder="ĐỀ KIỂM TRA HỌC KÌ I NĂM HỌC"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
                                        <div className="pr-4">
                                            <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-primary" />
                                                Tự động điền ký hiệu số câu
                                            </p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">Tự động sinh nhãn "Câu 1:", "Câu 2:" khi tạo mới các câu hỏi.</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={autoNumbering}
                                            onChange={(e) => setAutoNumbering(e.target.checked)}
                                            className="h-4.5 w-4.5 text-primary focus:ring-primary border-border rounded cursor-pointer"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
                                        <div className="pr-4">
                                            <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                                <Shuffle className="w-3.5 h-3.5 text-primary" />
                                                Tự động trộn phương án trắc nghiệm
                                            </p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">Hỗ trợ tự động đảo thứ tự ngẫu nhiên A, B, C, D khi giáo viên xuất bản đề thi PDF.</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={shuffleOptions}
                                            onChange={(e) => setShuffleOptions(e.target.checked)}
                                            className="h-4.5 w-4.5 text-primary focus:ring-primary border-border rounded cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: TRỢ LÝ AI & OCR */}
                        {activeTab === "ai" && (
                            <div className="space-y-4">
                                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider pb-2 border-b border-border/60 flex items-center gap-2">
                                    <Cpu className="w-4 h-4 text-primary" />
                                    Cấu hình Google Gemini & Trợ lý OCR
                                </h2>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground">Gemini API Key</label>
                                    <div className="relative">
                                        <Input
                                            type={showKey ? "text" : "password"}
                                            value={geminiKey}
                                            onChange={(e) => setGeminiKey(e.target.value)}
                                            className="h-10 border-border pr-10"
                                            placeholder="AIzaSy..."
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowKey(!showKey)}
                                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                        >
                                            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Key được mã hóa bảo mật cục bộ tại trình duyệt, phục vụ xử lý hình ảnh thành LaTeX.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground">Phiên bản mô hình AI chính</label>
                                        <Select value={aiModel} onValueChange={setAiModel}>
                                            <SelectTrigger className="h-10 border-border bg-background">
                                                <SelectValue placeholder="Chọn Model AI" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Tốc độ cao & Tiết kiệm)</SelectItem>
                                                <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Xử lý nâng cao & Sáng tạo)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground">Độ tự tin nhận diện tối thiểu (%)</label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={ocrConfidence}
                                            onChange={(e) => setOcrConfidence(e.target.value)}
                                            className="h-10 border-border"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30 pt-2">
                                    <div className="pr-4">
                                        <p className="text-xs font-bold text-foreground">Tự động dịch sang Tiếng Anh song ngữ</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">Khi quét OCR câu hỏi, AI tự động dịch đề bài sang Tiếng Anh kẹp song ngữ bên dưới câu hỏi.</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={autoTranslate}
                                        onChange={(e) => setAutoTranslate(e.target.checked)}
                                        className="h-4.5 w-4.5 text-primary focus:ring-primary border-border rounded cursor-pointer"
                                    />
                                </div>
                            </div>
                        )}

                        {/* TAB 4: HIỂN THỊ & GIAO DIỆN */}
                        {activeTab === "display" && (
                            <div className="space-y-4">
                                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider pb-2 border-b border-border/60 flex items-center gap-2">
                                    <Paintbrush className="w-4 h-4 text-primary" />
                                    Cấu hình hiển thị đề thi & Giao diện
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground">Chế độ giao diện (Theme)</label>
                                        <Select value={theme} onValueChange={setTheme}>
                                            <SelectTrigger className="h-10 border-border bg-background">
                                                <SelectValue placeholder="Chọn giao diện" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="system">Theo hệ thống / thiết bị (System Theme)</SelectItem>
                                                <SelectItem value="light">Giao diện Sáng (Light Theme)</SelectItem>
                                                <SelectItem value="dark">Giao diện Tối (Dark Theme)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground">Cỡ chữ hiển thị đề thi</label>
                                        <Select value={fontSize} onValueChange={setFontSize}>
                                            <SelectTrigger className="h-10 border-border bg-background">
                                                <SelectValue placeholder="Chọn cỡ chữ" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="13">Nhỏ (13px - Tiết kiệm không gian)</SelectItem>
                                                <SelectItem value="14">Vừa phải (14px - Dễ đọc nhất)</SelectItem>
                                                <SelectItem value="16">Lớn (16px - Trực quan rõ nét)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground">Chế độ hiển thị công thức LaTeX</label>
                                    <Select value={latexMode} onValueChange={setLatexMode}>
                                        <SelectTrigger className="h-10 border-border bg-background">
                                            <SelectValue placeholder="Chọn kiểu hiển thị" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="inline">Nằm cùng hàng văn bản (Inline Mode)</SelectItem>
                                            <SelectItem value="block">Xuống dòng canh giữa công thức (Block Mode)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[10px] text-muted-foreground">Thay đổi cấu trúc căn chỉnh vị trí hiển thị toán học khi duyệt ngân hàng câu hỏi.</p>
                                </div>

                                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                                    <p className="text-[11px] font-bold text-foreground flex items-center gap-1">
                                        <Laptop className="w-3.5 h-3.5 text-primary" />
                                        Xem trước hiển thị trực quan (Preview LaTeX):
                                    </p>
                                    <div className="p-3 rounded-lg border border-border bg-background text-center text-xs font-medium space-y-1.5">
                                        <p>Đề cương kiểm tra chương lượng tử ánh sáng:</p>
                                        <p className="text-primary font-bold">
                                            {latexMode === "inline" ? (
                                                <span>{"Công thức Năng lượng photon: $E = h \\cdot f = \\frac{h \\cdot c}{\\lambda}$ ($E$ đo bằng Joule)."}</span>
                                            ) : (
                                                <span className="block space-y-1 text-center">
                                                    <span>Năng lượng photon:</span>
                                                    <span className="block py-1 text-base">{"$E = h \\cdot f = \\frac{h \\cdot c}{\\lambda}$"}</span>
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Thanh hành động cuối Form & Toast thông báo thành công */}
                        <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
                            {savedSuccess ? (
                                <div className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in">
                                    <CheckCircle className="w-4 h-4 mr-1.5 shrink-0" />
                                    Cấu hình hệ thống cập nhật thành công!
                                </div>
                            ) : (
                                <div />
                            )}
                            <Button
                                type="submit"
                                disabled={saving}
                                className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl h-10 px-6 shrink-0 shadow-lg shadow-primary/10 transition-all active:scale-[0.98]"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang cập nhật...
                                    </>
                                ) : (
                                    "Lưu cấu hình"
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
