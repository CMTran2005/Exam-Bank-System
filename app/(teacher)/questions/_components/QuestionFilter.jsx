import { Search, Filter, Bookmark, Tag, MapPin, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import useProvinces from "@/hooks/shared/useProvinces";
import useSubjects from "@/hooks/shared/useSubjects";
import { useQuestionFilterStore } from "@/store/useQuestionFilterStore";

export function QuestionFilter({ uniqueExamTitles, uniqueTags }) {
    const {
        searchTerm, setSearchTerm, examTitleSearch, setExamTitleSearch,
        tagSearch, setTagSearch, selectedProvince, setSelectedProvince,
        selectedGrade, setSelectedGrade, selectedSubject, setSelectedSubject,
        selectedType, setSelectedType, selectedDifficulty, setSelectedDifficulty
    } = useQuestionFilterStore();
    const { provinces } = useProvinces();
    const { gradeSubjectsMap } = useSubjects();

    const GRADES_OPTIONS = Object.keys(gradeSubjectsMap).map(g => ({
        value: g,
        label: g === "Đại học" ? "Đại học" : `Lớp ${g}`
    }));
    const SUBJECTS = Array.from(new Set(Object.values(gradeSubjectsMap).flat())).sort((a, b) => a.localeCompare(b, "vi"));

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
                        className="pl-9 h-10 border-border"
                    />
                </div>

                <Combobox
                    value={examTitleSearch}
                    onValueChange={setExamTitleSearch}
                    options={[
                        { value: "all", label: "Tất cả đề thi" },
                        ...uniqueExamTitles.map(t => ({ value: t, label: t }))
                    ]}
                    placeholder="Tất cả đề thi"
                    icon={Bookmark}
                    className="h-10"
                />

                <Combobox
                    value={tagSearch}
                    onValueChange={setTagSearch}
                    options={[
                        { value: "all", label: "Tất cả thẻ (Tags)" },
                        ...uniqueTags.map(t => ({ value: t, label: t }))
                    ]}
                    placeholder="Tất cả thẻ (Tags)"
                    icon={Tag}
                    className="h-10"
                />

                <Combobox
                    value={selectedProvince}
                    onValueChange={setSelectedProvince}
                    options={[
                        { value: "all", label: "Tất cả tỉnh thành" },
                        ...provinces.map(p => ({ value: p, label: p }))
                    ]}
                    placeholder="Tất cả tỉnh thành"
                    icon={MapPin}
                    className="h-10"
                />

                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                    <SelectTrigger className="h-10 border-border">
                        <SelectValue placeholder="Tất cả lớp học" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả lớp học</SelectItem>
                        {GRADES_OPTIONS.map((g) => (
                            <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Combobox
                    value={selectedSubject}
                    onValueChange={setSelectedSubject}
                    options={[
                        { value: "all", label: "Tất cả môn học" },
                        ...SUBJECTS.map(s => ({ value: s, label: s }))
                    ]}
                    placeholder="Tất cả môn học"
                    icon={BookOpen}
                    className="h-10"
                />

                <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="h-10 border-border">
                        <SelectValue placeholder="Tất cả dạng câu hỏi" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả dạng câu hỏi</SelectItem>
                        <SelectItem value="multiple_choice">Trắc nghiệm Đơn</SelectItem>
                        <SelectItem value="group_multiple_choice">Trắc nghiệm Nhóm</SelectItem>
                        <SelectItem value="true_false">Đúng / Sai Đơn</SelectItem>
                        <SelectItem value="group_true_false">Đúng / Sai Nhóm</SelectItem>
                        <SelectItem value="essay">Tự luận Đơn</SelectItem>
                        <SelectItem value="group_essay">Tự luận Nhóm</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                    <SelectTrigger className="h-10 border-border">
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
