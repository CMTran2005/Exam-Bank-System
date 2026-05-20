import { GraduationCap, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomDatePicker } from "@/components/ui/date-time-picker";

const DEGREE_OPTIONS = [
    "Giáo viên", "Cộng tác viên", "Cử nhân (Đại học)", "Kĩ sư (Đại học)",
    "Thạc sĩ", "Tiến sĩ", "Phó Giáo sư", "Giáo sư"
];

const SUBJECT_OPTIONS = [
    "Toán học", "Vật lý", "Hóa học", "Sinh học", "Ngữ văn", "Tiếng Anh",
    "Lịch sử", "Địa lý", "Tin học", "Khoa học máy tính (CS)",
    "Kỹ thuật phần mềm (SE)", "Công nghệ thông tin (IT)",
    "Kỹ thuật Điện - Điện tử", "Kỹ thuật Cơ khí - Chế tạo máy",
    "Kỹ thuật Xây dựng", "Kế toán - Kiểm toán", "Quản trị kinh doanh",
    "Tài chính - Ngân hàng", "Luật học", "Y khoa - Dược học",
    "Ngoại thương - Kinh tế đối ngoại"
];

export function ProfileTab({
    name, setName, email, school, setSchool, phone, setPhone, degree, setDegree, mainSubject, setMainSubject,
    avatarUrl, setAvatarUrl, birthDate, setBirthDate, graduationYear, setGraduationYear, graduationGrade, setGraduationGrade, uploadingAvatar, handleAvatarChange,
    activeDropdown, setActiveDropdown
}) {
    const rawDegree = (degree || "").trim().normalize("NFC");
    const rawSubject = (mainSubject || "").trim().normalize("NFC");

    const safeDegree = DEGREE_OPTIONS.includes(rawDegree) ? rawDegree : (DEGREE_OPTIONS.find(d => d.localeCompare(rawDegree, undefined, { sensitivity: 'base' }) === 0) || "Thạc sĩ");
    const safeSubject = SUBJECT_OPTIONS.includes(rawSubject) ? rawSubject : (SUBJECT_OPTIONS.find(s => s.localeCompare(rawSubject, undefined, { sensitivity: 'base' }) === 0) || "Toán học");

    return (
        <div className="space-y-4">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider pb-2 border-b border-border/60 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                Thông tin giáo viên
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border border-border/80 bg-muted/10">
                <div className="relative group w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 shadow-md flex items-center justify-center bg-muted shrink-0">
                    {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                        <span className="text-xl font-bold text-muted-foreground uppercase">{name ? name.substring(0, 1) : "G"}</span>
                    )}
                    {uploadingAvatar && (
                        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-10">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        </div>
                    )}
                </div>
                <div className="flex-1 text-center sm:text-left space-y-1">
                    <p className="text-xs font-bold text-foreground">Avatar của người dùng</p>
                    <p className="text-[10px] text-muted-foreground">Tải ảnh mới từ thiết bị của bạn.</p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                        <label className="cursor-pointer">
                            <span className="inline-flex items-center justify-center h-8 px-3 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/95 rounded-lg transition-colors shadow-sm">
                                Chọn ảnh...
                            </span>
                            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" disabled={uploadingAvatar} />
                        </label>
                        {avatarUrl && (
                            <button
                                type="button" onClick={() => setAvatarUrl("")}
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
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10 border-border" placeholder="Nguyễn Văn A" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Địa chỉ Email</label>
                    <Input type="email" value={email} className="h-10 border-border bg-muted/40 text-muted-foreground" disabled />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Tên trường / Đơn vị công tác</label>
                    <Input value={school} onChange={(e) => setSchool(e.target.value)} className="h-10 border-border" placeholder="THPT Chuyên Quốc Học" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Số điện thoại liên hệ</label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10 border-border" placeholder="09XXXXXXXX" />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Ngày tháng năm sinh</label>
                    <CustomDatePicker
                        value={birthDate} onChange={setBirthDate}
                        isOpen={activeDropdown === 'birthDate'}
                        onToggle={() => setActiveDropdown(activeDropdown === 'birthDate' ? null : 'birthDate')}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Thời gian tốt nghiệp</label>
                    <Input type="text" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} className="h-10 border-border bg-background" placeholder="Năm hoặc tháng/năm tốt nghiệp" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Tốt nghiệp loại</label>
                    <Select value={graduationGrade} onValueChange={setGraduationGrade}>
                        <SelectTrigger className="h-10 border-border bg-background">
                            <SelectValue placeholder="Chọn xếp loại" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Chưa tốt nghiệp">Chưa tốt nghiệp</SelectItem>
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
                    <Select key={safeDegree} value={safeDegree} onValueChange={setDegree}>
                        <SelectTrigger className="h-10 border-border bg-background">
                            <SelectValue placeholder="Chọn học vị" />
                        </SelectTrigger>
                        <SelectContent>
                            {DEGREE_OPTIONS.map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Môn học giảng dạy chính</label>
                    <Select key={safeSubject} value={safeSubject} onValueChange={setMainSubject}>
                        <SelectTrigger className="h-10 border-border bg-background">
                            <SelectValue placeholder="Chọn môn học chính" />
                        </SelectTrigger>
                        <SelectContent>
                            {SUBJECT_OPTIONS.map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
