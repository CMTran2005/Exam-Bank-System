"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/hooks/shared/useSettings";

import { SettingsSidebar } from "./_components/SettingsSidebar";
import { ProfileTab } from "./_components/ProfileTab";
import { ExamTab } from "./_components/ExamTab";
import { AiTab } from "./_components/AiTab";
import { DisplayTab } from "./_components/DisplayTab";

/**
 * Component SettingsPage
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @returns {JSX.Element}
 */
export default function SettingsPage() {
    const { currentUser, setCurrentUser, loading } = useAuth();
    const router = useRouter();

    const {
        activeTab, setActiveTab, activeDropdown, setActiveDropdown,
        name, setName, email, school, setSchool, phone, setPhone, degree, setDegree, mainSubject, setMainSubject,
        avatarUrl, setAvatarUrl, birthDate, setBirthDate, graduationYear, setGraduationYear, graduationGrade, setGraduationGrade, uploadingAvatar, handleAvatarChange,
        defaultPoints, setDefaultPoints, pointsStep, setPointsStep, autoNumbering, setAutoNumbering, duration, setDuration, shuffleOptions, setShuffleOptions, headerTitle, setHeaderTitle,
        geminiKey, setGeminiKey, showKey, setShowKey, ocrConfidence, setOcrConfidence, aiModel, setAiModel, autoTranslate, setAutoTranslate,
        theme, setTheme, fontSize, setFontSize, latexMode, setLatexMode,
        saving, savedSuccess, handleSave
    } = useSettings(currentUser, setCurrentUser);

    useEffect(() => {
        if (!loading && !currentUser) {
            router.push("/login");
        }
    }, [currentUser, loading, router]);

    if (loading || !currentUser) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
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
                <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

                {/* Khung nội dung Cấu hình bên phải */}
                <div className="md:col-span-3 bg-card border border-border shadow-sm rounded-2xl p-5 sm:p-6">
                    <form onSubmit={handleSave} className="space-y-6">

                        {activeTab === "profile" && (
                            <ProfileTab 
                                name={name} setName={setName} email={email} school={school} setSchool={setSchool} phone={phone} setPhone={setPhone}
                                degree={degree} setDegree={setDegree} mainSubject={mainSubject} setMainSubject={setMainSubject}
                                avatarUrl={avatarUrl} setAvatarUrl={setAvatarUrl} birthDate={birthDate} setBirthDate={setBirthDate}
                                graduationYear={graduationYear} setGraduationYear={setGraduationYear} graduationGrade={graduationGrade} setGraduationGrade={setGraduationGrade}
                                uploadingAvatar={uploadingAvatar} handleAvatarChange={handleAvatarChange}
                                activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown}
                            />
                        )}

                        {activeTab === "exam" && (
                            <ExamTab 
                                defaultPoints={defaultPoints} setDefaultPoints={setDefaultPoints} pointsStep={pointsStep} setPointsStep={setPointsStep}
                                duration={duration} setDuration={setDuration} headerTitle={headerTitle} setHeaderTitle={setHeaderTitle}
                                autoNumbering={autoNumbering} setAutoNumbering={setAutoNumbering} shuffleOptions={shuffleOptions} setShuffleOptions={setShuffleOptions}
                            />
                        )}

                        {activeTab === "ai" && (
                            <AiTab 
                                geminiKey={geminiKey} setGeminiKey={setGeminiKey} showKey={showKey} setShowKey={setShowKey}
                                aiModel={aiModel} setAiModel={setAiModel} ocrConfidence={ocrConfidence} setOcrConfidence={setOcrConfidence}
                                autoTranslate={autoTranslate} setAutoTranslate={setAutoTranslate}
                            />
                        )}

                        {activeTab === "display" && (
                            <DisplayTab 
                                theme={theme} setTheme={setTheme} fontSize={fontSize} setFontSize={setFontSize} latexMode={latexMode} setLatexMode={setLatexMode}
                            />
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
