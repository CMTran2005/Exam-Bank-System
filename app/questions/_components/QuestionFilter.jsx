import { Search, Filter, Bookmark, Tag, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GRADE_SUBJECTS_MAP } from "@/lib/constants";
import useProvinces from "@/hooks/useProvinces";

const GRADES_OPTIONS = Object.keys(GRADE_SUBJECTS_MAP).map(g => ({
    value: g,
    label: g === "Đại học" ? "Đại học" : `Lớp ${g}`
}));
const SUBJECTS = Array.from(new Set(Object.values(GRADE_SUBJECTS_MAP).flat())).sort((a, b) => a.localeCompare(b, "vi"));

export function QuestionFilter({
    searchTerm, setSearchTerm, examTitleSearch, setExamTitleSearch, uniqueExamTitles,
    tagSearch, setTagSearch, uniqueTags, selectedProvince, setSelectedProvince,
    selectedGrade, setSelectedGrade, selectedSubject, setSelectedSubject,
    selectedType, setSelectedType, selectedDifficulty, setSelectedDifficulty
}) {
    const { provinces } = useProvinces();

    return (
        <div className="bg-card border border-border shadow-sm rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Filter className="w-4 h-4 text-primary" />
                <span>Bộ lọc nâng cao</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm theo nội dung..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-10 border-border bg-background"
                    />
                </div>

                <Select value={examTitleSearch} onValueChange={setExamTitleSearch}>
                    <SelectTrigger className="h-10 border-border bg-background">
                        <span className="flex items-center gap-2">
                            <Bookmark className="w-3.5 h-3.5 text-muted-foreground" />
                            <SelectValue placeholder="Tất cả đề thi" />
                        </span>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả đề thi</SelectItem>
                        {uniqueExamTitles.map((title) => (
                            <SelectItem key={title} value={title}>{title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={tagSearch} onValueChange={setTagSearch}>
                    <SelectTrigger className="h-10 border-border bg-background">
                        <span className="flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                            <SelectValue placeholder="Tất cả thẻ phân loại" />
                        </span>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả thẻ (Tags)</SelectItem>
                        {uniqueTags.map((tag) => (
                            <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                    <SelectTrigger className="h-10 border-border bg-background">
                        <span className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                            <SelectValue placeholder="Tất cả tỉnh thành" />
                        </span>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả tỉnh thành</SelectItem>
                        {provinces.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                    <SelectTrigger className="h-10 border-border bg-background">
                        <SelectValue placeholder="Tất cả lớp học" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả lớp học</SelectItem>
                        {GRADES_OPTIONS.map((g) => (
                            <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="h-10 border-border bg-background">
                        <SelectValue placeholder="Tất cả môn học" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả môn học</SelectItem>
                        {SUBJECTS.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="h-10 border-border bg-background">
                        <SelectValue placeholder="Tất cả dạng câu hỏi" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả dạng câu hỏi</SelectItem>
                        <SelectItem value="multiple_choice">Trắc nghiệm Đơn</SelectItem>
                        <SelectItem value="group_multiple_choice">Trắc nghiệm Nhóm</SelectItem>
                        <SelectItem value="true_false">Đúng / Sai Đơn</SelectItem>
                        <SelectItem value="essay">Tự luận Đơn</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                    <SelectTrigger className="h-10 border-border bg-background">
                        <SelectValue placeholder="Tất cả mức độ" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả mức độ</SelectItem>
                        <SelectItem value="nhan_biet">Nhận biết</SelectItem>
                        <SelectItem value="thong_hieu">Thông hiểu</SelectItem>
                        <SelectItem value="van_dung">Vận dụng</SelectItem>
                        <SelectItem value="van_dung_cao">Vận dụng cao</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
