import { useState, useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useTheme } from "next-themes";

const runWithTimeout = (promise, ms = 1000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Hết thời gian chờ phản hồi Firebase")), ms)
        )
    ]);
};

export function useSettings(currentUser, setCurrentUser) {
    const { theme: activeTheme, setTheme: setActiveTheme } = useTheme();

    const [activeTab, setActiveTab] = useState("profile");
    const [activeDropdown, setActiveDropdown] = useState(null);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [school, setSchool] = useState("");
    const [phone, setPhone] = useState("");
    const [degree, setDegree] = useState("Thạc sĩ");
    const [mainSubject, setMainSubject] = useState("Toán học");

    const [avatarUrl, setAvatarUrl] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [graduationYear, setGraduationYear] = useState("");
    const [graduationGrade, setGraduationGrade] = useState("Chưa tốt nghiệp");
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const [defaultPoints, setDefaultPoints] = useState("1.0");
    const [pointsStep, setPointsStep] = useState("0.25");
    const [autoNumbering, setAutoNumbering] = useState(true);
    const [duration, setDuration] = useState("90");
    const [shuffleOptions, setShuffleOptions] = useState(true);
    const [headerTitle, setHeaderTitle] = useState("ĐỀ KIỂM TRA CHẤT LƯỢNG HỌC KỲ");

    const [geminiKey, setGeminiKey] = useState("••••••••••••••••••••••••••••••••••••");
    const [showKey, setShowKey] = useState(false);
    const [ocrConfidence, setOcrConfidence] = useState("95");
    const [aiModel, setAiModel] = useState("gemini-2.5-flash");
    const [autoTranslate, setAutoTranslate] = useState(false);

    const [theme, setTheme] = useState("system");
    const [fontSize, setFontSize] = useState("14");
    const [latexMode, setLatexMode] = useState("inline");

    const [saving, setSaving] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name || "");
            setEmail(currentUser.email || "");
            setSchool(currentUser.school || "");
            setPhone(currentUser.phone || "");

            let loadedDegree = (currentUser.degree || "Thạc sĩ").normalize("NFC");
            if (loadedDegree === "Cử nhân") loadedDegree = "Cử nhân (Đại học)";
            if (loadedDegree === "Kĩ sư") loadedDegree = "Kĩ sư (Đại học)";

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

            setDegree(loadedDegree);
            setMainSubject(loadedSubject);
        }
    }, [currentUser]);

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

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSavedSuccess(false);

        const newSettings = {
            phone, degree, mainSubject, defaultPoints, pointsStep, autoNumbering, duration,
            shuffleOptions, headerTitle, geminiKey, ocrConfidence, aiModel, autoTranslate,
            theme, fontSize, latexMode
        };

        localStorage.setItem("eb_system_settings", JSON.stringify(newSettings));
        localStorage.setItem("eb_theme", theme);
        localStorage.setItem("eb_font_size", fontSize);
        setActiveTheme(theme);

        if (currentUser) {
            const updatedUser = {
                ...currentUser, name, school, phone, degree, mainSubject, avatarUrl,
                birthDate, graduationYear, graduationGrade
            };

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

    return {
        activeTab, setActiveTab, activeDropdown, setActiveDropdown,
        name, setName, email, school, setSchool, phone, setPhone, degree, setDegree, mainSubject, setMainSubject,
        avatarUrl, setAvatarUrl, birthDate, setBirthDate, graduationYear, setGraduationYear, graduationGrade, setGraduationGrade, uploadingAvatar, handleAvatarChange,
        defaultPoints, setDefaultPoints, pointsStep, setPointsStep, autoNumbering, setAutoNumbering, duration, setDuration, shuffleOptions, setShuffleOptions, headerTitle, setHeaderTitle,
        geminiKey, setGeminiKey, showKey, setShowKey, ocrConfidence, setOcrConfidence, aiModel, setAiModel, autoTranslate, setAutoTranslate,
        theme, setTheme, fontSize, setFontSize, latexMode, setLatexMode,
        saving, savedSuccess, handleSave
    };
}
