import { GraduationCap, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomDatePicker } from "@/components/ui/date-time-picker";

export function ProfileTab({
    name, setName, email, school, setSchool, phone, setPhone, degree, setDegree, mainSubject, setMainSubject,
    avatarUrl, setAvatarUrl, birthDate, setBirthDate, graduationYear, setGraduationYear, graduationGrade, setGraduationGrade, uploadingAvatar, handleAvatarChange,
    activeDropdown, setActiveDropdown
}) {
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
                    <p className="text-xs font-bold text-foreground">Ảnh đại diện Giáo viên</p>
                    <p className="text-[10px] text-muted-foreground">Tải ảnh mới từ máy tính của bạn. Lưu trữ điện toán đám mây an toàn qua Cloudinary.</p>
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
                            <SelectItem value="Chưa tốt nghiệp">Chưa tốt nghiệp (Đang học / CTV)</SelectItem>
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
                            <SelectItem value={"Toán học".normalize("NFC")}>Toán học</SelectItem>
                            <SelectItem value={"Vật lý".normalize("NFC")}>Vật lý</SelectItem>
                            <SelectItem value={"Hóa học".normalize("NFC")}>Hóa học</SelectItem>
                            <SelectItem value={"Sinh học".normalize("NFC")}>Sinh học</SelectItem>
                            <SelectItem value={"Ngữ văn".normalize("NFC")}>Ngữ văn</SelectItem>
                            <SelectItem value={"Tiếng Anh".normalize("NFC")}>Tiếng Anh</SelectItem>
                            <SelectItem value={"Lịch sử".normalize("NFC")}>Lịch sử</SelectItem>
                            <SelectItem value={"Địa lý".normalize("NFC")}>Địa lý</SelectItem>
                            <SelectItem value={"Tin học".normalize("NFC")}>Tin học</SelectItem>
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
    );
}
