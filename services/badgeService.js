import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const badgeService = {
    /**
     * Lấy toàn bộ danh sách huy hiệu từ hệ thống.
     * Nếu chưa có huy hiệu nào (hoặc không đủ), hệ thống sẽ tự động khởi tạo dữ liệu mẫu (seed).
     * @returns {Promise<Array>} - Danh sách các huy hiệu có sẵn
     */
    async getBadges() {
        const badgesRef = collection(db, "badges");
        const snapshot = await getDocs(badgesRef);
        // Tự động khởi tạo dữ liệu nếu danh sách huy hiệu chưa đầy đủ
        if (snapshot.empty || snapshot.docs.length < 66) {
            return await this.seedBadges();
        }
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    /**
     * Khởi tạo bộ dữ liệu chuẩn gồm 58 huy hiệu mặc định của hệ thống
     * @returns {Promise<Array>} - Danh sách huy hiệu vừa được khởi tạo
     */
    async seedBadges() {
        const TIERS = {
            BRONZE: {
                label: "Đồng",
                color: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50"
            },
            SILVER: {
                label: "Bạc",
                color: "text-zinc-500 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800"
            },
            GOLD: {
                label: "Vàng",
                color: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900/50"
            },
            PLATINUM: {
                label: "Bạch Kim",
                color: "text-slate-600 dark:text-slate-200 bg-sky-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
            },
            DIAMOND: {
                label: "Kim Cương",
                color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/50"
            },
        };

        const initialBadges = [
            // ==========================================
            // NHÓM 1: CỘT MỐC ĐẶC BIỆT & VINH DANH
            // ==========================================
            { id: "first_blood", name: "Tân Binh Tích Cực", desc: "Hoàn thành bài thi đầu tiên", iconStr: "Zap", tier: TIERS.DIAMOND, rule: { type: "min_attempts", value: 1 } },
            { id: "flawless", name: "Xạ Thủ Hoàn Hảo", desc: "Đạt điểm 10 tròn trịa", iconStr: "Target", tier: TIERS.DIAMOND, rule: { type: "perfect_score" } },
            { id: "terminator", name: "Kẻ Hủy Diệt", desc: "Đạt điểm 10 trong 10 bài thi liên tiếp", iconStr: "Crosshair", tier: TIERS.DIAMOND, rule: { type: "consecutive_perfect_scores", count: 10 } },

            // ==========================================
            // NHÓM 2: NGƯỜI CHĂM CHỈ (Số lượng bài làm)
            // ==========================================
            { id: "hardworker_bronze", name: "Tân Binh Miệt Mài", desc: "Hoàn thành 5 bài thi", iconStr: "Flame", tier: TIERS.BRONZE, rule: { type: "min_attempts", value: 5 } },
            { id: "hardworker_silver", name: "Học Giả Cần Mẫn", desc: "Hoàn thành 15 bài thi", iconStr: "Flame", tier: TIERS.SILVER, rule: { type: "min_attempts", value: 15 } },
            { id: "hardworker_gold", name: "Mọt Sách Chính Hiệu", desc: "Hoàn thành 30 bài thi", iconStr: "Flame", tier: TIERS.GOLD, rule: { type: "min_attempts", value: 30 } },
            { id: "hardworker_platinum", name: "Chiến Thần Học Tập", desc: "Hoàn thành 50 bài thi", iconStr: "Flame", tier: TIERS.PLATINUM, rule: { type: "min_attempts", value: 50 } },
            { id: "hardworker_diamond", name: "Kẻ Cuồng Học", desc: "Hoàn thành 100 bài thi", iconStr: "Flame", tier: TIERS.DIAMOND, rule: { type: "min_attempts", value: 100 } },

            // ==========================================
            // NHÓM 3: THỢ SĂN ĐIỂM (Điểm >= 8)
            // ==========================================
            { id: "excellent_bronze", name: "Điểm 8 Đầu Tay", desc: "Đạt 1 bài thi >= 8 điểm", iconStr: "Star", tier: TIERS.BRONZE, rule: { type: "min_score_count", value: 1, minScore: 8 } },
            { id: "excellent_silver", name: "Người Săn Điểm", desc: "Đạt 5 bài thi >= 8 điểm", iconStr: "Star", tier: TIERS.SILVER, rule: { type: "min_score_count", value: 5, minScore: 8 } },
            { id: "excellent_gold", name: "Cao Thủ Bức Phá", desc: "Đạt 15 bài thi >= 8 điểm", iconStr: "Star", tier: TIERS.GOLD, rule: { type: "min_score_count", value: 15, minScore: 8 } },
            { id: "excellent_platinum", name: "Chúa Tể Điểm Số", desc: "Đạt 30 bài thi >= 8 điểm", iconStr: "Star", tier: TIERS.PLATINUM, rule: { type: "min_score_count", value: 30, minScore: 8 } },
            { id: "excellent_diamond", name: "Huyền Thoại Học Bá", desc: "Đạt 50 bài thi >= 8 điểm", iconStr: "Star", tier: TIERS.DIAMOND, rule: { type: "min_score_count", value: 50, minScore: 8 } },

            // ==========================================
            // NHÓM 4: THỦ KHOA (Điểm >= 9.5)
            // ==========================================
            { id: "perfect_bronze", name: "Lần Đầu Lên Đỉnh", desc: "Đạt 1 bài thi >= 9.5 điểm", iconStr: "Trophy", tier: TIERS.BRONZE, rule: { type: "min_score_count", value: 1, minScore: 9.5 } },
            { id: "perfect_silver", name: "Gương Mặt Vàng", desc: "Đạt 5 bài thi >= 9.5 điểm", iconStr: "Trophy", tier: TIERS.SILVER, rule: { type: "min_score_count", value: 5, minScore: 9.5 } },
            { id: "perfect_gold", name: "Thủ Khoa Toàn Năng", desc: "Đạt 10 bài thi >= 9.5 điểm", iconStr: "Trophy", tier: TIERS.GOLD, rule: { type: "min_score_count", value: 10, minScore: 9.5 } },
            { id: "perfect_platinum", name: "Vua Điểm Mười", desc: "Đạt 30 bài thi >= 9.5 điểm", iconStr: "Trophy", tier: TIERS.PLATINUM, rule: { type: "min_score_count", value: 30, minScore: 9.5 } },
            { id: "perfect_diamond", name: "Kẻ Phá Đảo Thi Cử", desc: "Đạt 50 bài thi >= 9.5 điểm", iconStr: "Crown", tier: TIERS.DIAMOND, rule: { type: "min_score_count", value: 50, minScore: 9.5 } },

            // ==========================================
            // NHÓM 5: KHÁM PHÁ & ĐA TÀI (Sự đa dạng)
            // ==========================================
            { id: "explorer_bronze", name: "Lính Mới Trinh Sát", desc: "Tham gia 1 lớp thi", iconStr: "Compass", tier: TIERS.BRONZE, rule: { type: "min_classes", value: 1 } },
            { id: "explorer_silver", name: "Kẻ Tò Mò", desc: "Tham gia 5 lớp thi", iconStr: "Compass", tier: TIERS.SILVER, rule: { type: "min_classes", value: 5 } },
            { id: "explorer_gold", name: "Nhà Lữ Hành Kiến Thức", desc: "Tham gia 10 lớp thi", iconStr: "Compass", tier: TIERS.GOLD, rule: { type: "min_classes", value: 10 } },
            { id: "explorer_platinum", name: "Chúa Tể Lớp Học", desc: "Tham gia 30 lớp thi", iconStr: "Compass", tier: TIERS.PLATINUM, rule: { type: "min_classes", value: 30 } },
            { id: "explorer_diamond", name: "Đại Sứ Mọi Lớp", desc: "Tham gia 50 lớp thi", iconStr: "Compass", tier: TIERS.DIAMOND, rule: { type: "min_classes", value: 50 } },

            { id: "polymath_bronze", name: "Mọt Sách Học Trữ", desc: "Hoàn thành bài thi ở 3 đề thi khác nhau", iconStr: "BookOpen", tier: TIERS.BRONZE, rule: { type: "diverse_subjects", value: 3 } },
            { id: "polymath_silver", name: "Học Giả Đa Tài", desc: "Hoàn thành bài thi ở 7 đề thi khác nhau", iconStr: "BookOpen", tier: TIERS.SILVER, rule: { type: "diverse_subjects", value: 7 } },
            { id: "polymath_gold", name: "Nhà Thông Thái", desc: "Hoàn thành bài thi ở 30 đề thi khác nhau", iconStr: "GraduationCap", tier: TIERS.GOLD, rule: { type: "diverse_subjects", value: 30 } },
            { id: "polymath_platinum", name: "Đại Học Giả", desc: "Hoàn thành bài thi ở 90 đề thi khác nhau", iconStr: "GraduationCap", tier: TIERS.PLATINUM, rule: { type: "diverse_subjects", value: 90 } },
            { id: "polymath_diamond", name: "Quyển Bách Khoa Toàn Thư", desc: "Hoàn thành bài thi ở 180 đề thi khác nhau", iconStr: "GraduationCap", tier: TIERS.DIAMOND, rule: { type: "diverse_subjects", value: 180 } },

            // ==========================================
            // NHÓM 6: CHUYÊN SÂU & LỐI SỐNG
            // ==========================================
            { id: "specialist", name: "Chuyên Gia", desc: "Đạt >= 8 điểm trong 5 bài thi của cùng một môn", iconStr: "Focus", tier: TIERS.GOLD, rule: { type: "class_mastery", minCount: 5, minScore: 8 } },
            { id: "night_owl", name: "Cú Đêm", desc: "Làm bài thi vào lúc 22h - 4h", iconStr: "MoonStar", tier: TIERS.DIAMOND, rule: { type: "night_owl" } },
            { id: "vampire", name: "Chúa Tể Bóng Đêm", desc: "Làm 5 bài thi vào lúc 1h - 4h sáng", iconStr: "Ghost", tier: TIERS.PLATINUM, rule: { type: "vampire", minAttempts: 5, startHour: 1, endHour: 4 } },
            { id: "early_bird", name: "Chim Sớm", desc: "Làm bài thi vào lúc 4h - 7h sáng", iconStr: "Sunrise", tier: TIERS.DIAMOND, rule: { type: "early_bird" } },
            { id: "weekend_warrior", name: "Chiến Binh Cuối Tuần", desc: "Chăm chỉ làm bài vào Thứ 7, Chủ Nhật", iconStr: "Calendar", tier: TIERS.DIAMOND, rule: { type: "weekend_warrior" } },

            // ==========================================
            // NHÓM 7: TỔNG ĐIỂM TÍCH LŨY (Grinding)
            // ==========================================
            { id: "score_accumulator_bronze", name: "Hành Trình Mới", desc: "Tổng điểm các bài thi đạt 50", iconStr: "TrendingUp", tier: TIERS.BRONZE, rule: { type: "total_score", value: 50 } },
            { id: "score_accumulator_silver", name: "Tích Tiểu Thành Đại", desc: "Tổng điểm các bài thi đạt 100", iconStr: "TrendingUp", tier: TIERS.SILVER, rule: { type: "total_score", value: 100 } },
            { id: "score_accumulator_gold", name: "Túi Tinh Hoa", desc: "Tổng điểm các bài thi đạt 500", iconStr: "TrendingUp", tier: TIERS.GOLD, rule: { type: "total_score", value: 500 } },
            { id: "score_accumulator_platinum", name: "Kho Tàng Trí Thức", desc: "Tổng điểm các bài thi đạt 1000", iconStr: "TrendingUp", tier: TIERS.PLATINUM, rule: { type: "total_score", value: 1000 } },
            { id: "score_accumulator_diamond", name: "Đế Chế Điểm Số", desc: "Tổng điểm các bài thi đạt 2000", iconStr: "TrendingUp", tier: TIERS.DIAMOND, rule: { type: "total_score", value: 2000 } },

            // ==========================================
            // NHÓM 8: NGÀY HOẠT ĐỘNG & CHUỖI LIÊN TỤC
            // ==========================================
            { id: "consistent_bronze", name: "Người Bạn Mới", desc: "Làm bài trong 3 ngày khác nhau", iconStr: "CalendarCheck", tier: TIERS.BRONZE, rule: { type: "active_days", value: 3 } },
            { id: "consistent_silver", name: "Kẻ Kiên Trì", desc: "Làm bài trong 7 ngày khác nhau", iconStr: "CalendarCheck", tier: TIERS.SILVER, rule: { type: "active_days", value: 7 } },
            { id: "consistent_gold", name: "Chiến Binh Bền Bỉ", desc: "Làm bài trong 30 ngày khác nhau", iconStr: "CalendarCheck", tier: TIERS.GOLD, rule: { type: "active_days", value: 30 } },
            { id: "consistent_platinum", name: "Kỷ Luật Sắt", desc: "Làm bài trong 90 ngày khác nhau", iconStr: "CalendarCheck", tier: TIERS.PLATINUM, rule: { type: "active_days", value: 90 } },
            { id: "consistent_diamond", name: "Ngọn Lửa Bất Diệt", desc: "Làm bài trong 180 ngày khác nhau", iconStr: "CalendarCheck", tier: TIERS.DIAMOND, rule: { type: "active_days", value: 180 } },

            { id: "streak_1day", name: "Khởi Đầu", desc: "Làm bài trong 1 ngày", iconStr: "Flame", tier: TIERS.BRONZE, rule: { type: "consecutive_days", value: 1 } },
            { id: "streak_3days", name: "Thói Quen Tốt", desc: "Làm bài trong 3 ngày", iconStr: "Flame", tier: TIERS.SILVER, rule: { type: "consecutive_days", value: 3 } },
            { id: "streak_7days", name: "Thói Quen Vàng", desc: "Duy trì làm bài liên tục 7 ngày", iconStr: "Flame", tier: TIERS.GOLD, rule: { type: "consecutive_days", value: 7 } },
            { id: "streak_30days", name: "Ý Chí Thép", desc: "Duy trì làm bài liên tục 30 ngày", iconStr: "Crown", tier: TIERS.PLATINUM, rule: { type: "consecutive_days", value: 30 } },
            { id: "streak_90days", name: "Đấng Tối Cao", desc: "Duy trì làm bài liên tục 90 ngày", iconStr: "Crown", tier: TIERS.DIAMOND, rule: { type: "consecutive_days", value: 90 } },

            // ==========================================
            // NHÓM 9: PHONG ĐỘ & KHÍCH LỆ
            // ==========================================
            { id: "comeback_kid", name: "Sự Trở Lại Mạnh Mẽ", desc: "Bài thi sau cao hơn bài thi trước ít nhất 3 điểm", iconStr: "TrendingUp", tier: TIERS.SILVER, rule: { type: "score_improvement", value: 3 } },
            { id: "improvement_streak", name: "Cải Thiện Vượt Bậc", desc: "Cải thiện 5 điểm liên tiếp", iconStr: "TrendingUp", tier: TIERS.PLATINUM, rule: { type: "improvement_streak", count: 5, scoreIncrease: 5 } },
            { id: "streak_master", name: "Phong Độ Ổn Định", desc: "Đạt từ 8 điểm trở lên trong 3 bài thi liên tiếp", iconStr: "Zap", tier: TIERS.GOLD, rule: { type: "consecutive_high_scores", count: 3, minScore: 8 } },
            { id: "perfect_streak", name: "Chuỗi Hoàn Hảo", desc: "Đạt điểm 10 trong 3 bài thi liên tiếp", iconStr: "Zap", tier: TIERS.DIAMOND, rule: { type: "consecutive_perfect_scores", count: 3 } },

            { id: "close_enough", name: "Suýt Chút Nữa Thôi", desc: "Đạt đúng 9.9 hoặc 4.9 điểm", iconStr: "HeartPulse", tier: TIERS.BRONZE, rule: { type: "near_miss", values: [4.9, 9.9] } },
            { id: "persistent_learner", name: "Bại Binh Phục Hận", desc: "Thi trượt nhưng thi đỗ lại sau đó", iconStr: "ShieldCheck", tier: TIERS.SILVER, rule: { type: "fail_then_pass" } },
            { id: "awakened", name: "Thức Tỉnh", desc: "Bị dưới 5 điểm, nhưng bài ngay sau đó đạt 10", iconStr: "Dna", tier: TIERS.PLATINUM, rule: { type: "awakened" } },
            { id: "iron_chin", name: "Vua Lì Đòn", desc: "Bị điểm dưới 5 liên tục 3 lần, lần thứ 4 đạt >= 8", iconStr: "ShieldAlert", tier: TIERS.DIAMOND, rule: { type: "iron_chin" } },

            // ==========================================
            // NHÓM 10: TỐC ĐỘ (Speed)
            // ==========================================
            { id: "flash_bronze", name: "Tia Chớp Nhỏ", desc: "Hoàn thành 1 bài thi xuất sắc (>=8đ) dưới 5 phút", iconStr: "Timer", tier: TIERS.BRONZE, rule: { type: "speed_count", count: 1, maxMinutes: 5, minScore: 8 } },
            { id: "flash_silver", name: "Tia Chớp Bạc", desc: "Hoàn thành 5 bài thi xuất sắc (>=8đ) dưới 5 phút", iconStr: "Timer", tier: TIERS.SILVER, rule: { type: "speed_count", count: 5, maxMinutes: 5, minScore: 8 } },
            { id: "flash_gold", name: "Tia Chớp Vàng", desc: "Hoàn thành 15 bài thi xuất sắc (>=8đ) dưới 5 phút", iconStr: "Timer", tier: TIERS.GOLD, rule: { type: "speed_count", count: 15, maxMinutes: 5, minScore: 8 } },
            { id: "flash_platinum", name: "Tia Chớp Bạch Kim", desc: "Hoàn thành 30 bài thi xuất sắc (>=8đ) dưới 5 phút", iconStr: "Zap", tier: TIERS.PLATINUM, rule: { type: "speed_count", count: 30, maxMinutes: 5, minScore: 8 } },
            { id: "flash_diamond", name: "Tia Chớp Kim Cương", desc: "Hoàn thành 100 bài thi xuất sắc (>=8đ) dưới 5 phút", iconStr: "Zap", tier: TIERS.DIAMOND, rule: { type: "speed_count", count: 100, maxMinutes: 5, minScore: 8 } },
            // ==========================================
            // NHÓM 11: LEO RANK (Giải đấu)
            // ==========================================
            { id: "rank_bronze", name: "Chiến Binh Mới", desc: "Đạt Hạng Đồng (Tier 2+)", iconStr: "Shield", tier: TIERS.BRONZE, rule: { type: "min_rank", value: 2 } },
            { id: "rank_silver", name: "Chiến Binh Bạc", desc: "Đạt Hạng Bạc (Tier 5+)", iconStr: "ShieldCheck", tier: TIERS.SILVER, rule: { type: "min_rank", value: 5 } },
            { id: "rank_gold", name: "Chinh Phục Đỉnh Cao", desc: "Đạt Hạng Vàng (Tier 8+)", iconStr: "Gem", tier: TIERS.GOLD, rule: { type: "min_rank", value: 8 } },
            { id: "rank_platinum", name: "Huyền Thoại Trỗi Dậy", desc: "Đạt Hạng Bạch Kim (Tier 11+)", iconStr: "Sparkles", tier: TIERS.PLATINUM, rule: { type: "min_rank", value: 11 } },
            { id: "rank_diamond", name: "Kẻ Thách Thức", desc: "Đạt Hạng Kim Cương (Tier 14+)", iconStr: "Rocket", tier: TIERS.DIAMOND, rule: { type: "min_rank", value: 14 } },
            { id: "rank_master", name: "Đỉnh Cao Vinh Quang", desc: "Đạt Hạng Thách Đấu (Tier 15)", iconStr: "Crown", tier: TIERS.DIAMOND, rule: { type: "min_rank", value: 15 } },
        ];

        const badgesRef = collection(db, "badges");
        for (const badge of initialBadges) {
            await setDoc(doc(badgesRef, badge.id), badge);
        }

        return initialBadges;
    },

    /**
     * Đánh giá xem học sinh có đủ điều kiện nhận một huy hiệu cụ thể hay không
     * @param {Object} badge - Thông tin cấu hình của huy hiệu cần xét
     * @param {Object} contextData - Dữ liệu bối cảnh gồm attempts, classes, leagueRank
     * @returns {boolean} - Trả về true nếu học sinh đạt điều kiện nhận huy hiệu
     */
    evaluateCondition(badge, contextData) {
        if (!badge.rule) return false;

        // Tương thích ngược: Nếu gọi kiểu cũ truyền 3 tham số (badge, attempts, classes)
        let rawAttempts = [];
        let classes = [];
        let leagueRank = 1;
        
        if (Array.isArray(contextData)) {
            rawAttempts = arguments[1] || [];
            classes = arguments[2] || [];
        } else if (contextData) {
            rawAttempts = contextData.attempts || [];
            classes = contextData.classes || [];
            leagueRank = contextData.leagueRank || 1;
        }

        const allowPracticeRules = [
            "min_attempts", "min_classes", "diverse_subjects", "night_owl",
            "vampire", "early_bird", "weekend_warrior", "active_days", "consecutive_days", "min_rank"
        ];

        // Lọc bài thi: Nếu luật không áp dụng cho Luyện tập tự do, loại bỏ các bài thi có classId là 'practice'
        const attempts = allowPracticeRules.includes(badge.rule.type)
            ? rawAttempts
            : rawAttempts.filter(a => a.classId && a.classId !== "practice");

        switch (badge.rule.type) {
            case "min_rank":
                return leagueRank >= badge.rule.value;
            case "min_attempts":
                return attempts.length >= badge.rule.value;
            case "min_score_count":
                return attempts.filter(x => x.score >= badge.rule.minScore).length >= badge.rule.value;
            case "min_classes":
                return classes.length >= badge.rule.value;
            case "perfect_score":
                return attempts.some(x => x.score === 10);
            case "night_owl":
                return attempts.some(x => {
                    if (!x.startTime) return false;
                    const h = new Date(x.startTime).getHours();
                    return h >= 22 || h <= 4;
                });
            case "early_bird":
                return attempts.some(x => {
                    if (!x.startTime) return false;
                    const h = new Date(x.startTime).getHours();
                    return h > 4 && h <= 7;
                });
            case "weekend_warrior":
                return attempts.some(x => {
                    if (!x.startTime) return false;
                    const day = new Date(x.startTime).getDay();
                    return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
                });
            case "total_score":
                const totalScore = attempts.reduce((sum, a) => sum + (Number(a.score) || 0), 0);
                return totalScore >= badge.rule.value;
            case "active_days":
                const days = new Set(attempts.map(a => {
                    if (!a.startTime) return null;
                    return new Date(a.startTime).toDateString();
                }).filter(Boolean));
                return days.size >= badge.rule.value;

            case "score_improvement":
                const sortedForImp = [...attempts].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
                for (let i = 1; i < sortedForImp.length; i++) {
                    if (sortedForImp[i].score - sortedForImp[i - 1].score >= badge.rule.value) return true;
                }
                return false;

            case "consecutive_high_scores":
                let currentStreak = 0;
                const sortedForStreak = [...attempts].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
                for (let a of sortedForStreak) {
                    if (a.score >= badge.rule.minScore) {
                        currentStreak++;
                        if (currentStreak >= badge.rule.count) return true;
                    } else {
                        currentStreak = 0;
                    }
                }
                return false;

            case "consecutive_perfect_scores":
                let perfStreak = 0;
                const sortedPerfStreak = [...attempts].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
                for (let a of sortedPerfStreak) {
                    if (a.score === 10) {
                        perfStreak++;
                        if (perfStreak >= badge.rule.count) return true;
                    } else {
                        perfStreak = 0;
                    }
                }
                return false;

            case "improvement_streak":
                const sortedImpStreak = [...attempts].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
                let impStreak = 1;
                for (let i = 1; i < sortedImpStreak.length; i++) {
                    if (sortedImpStreak[i].score - sortedImpStreak[i - 1].score >= badge.rule.scoreIncrease) {
                        impStreak++;
                        if (impStreak >= badge.rule.count) return true;
                    } else {
                        impStreak = 1;
                    }
                }
                return false;

            case "class_mastery":
                const classScores = {};
                attempts.forEach(a => {
                    if (a.score >= badge.rule.minScore) {
                        classScores[a.examId] = (classScores[a.examId] || 0) + 1;
                    }
                });
                return Object.values(classScores).some(count => count >= badge.rule.minCount);

            case "vampire":
                const vampireAttempts = attempts.filter(a => {
                    if (!a.startTime) return false;
                    const h = new Date(a.startTime).getHours();
                    return h >= badge.rule.startHour && h < badge.rule.endHour;
                });
                return vampireAttempts.length >= badge.rule.minAttempts;

            case "awakened":
                const sortedAwk = [...attempts].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
                for (let i = 1; i < sortedAwk.length; i++) {
                    if (sortedAwk[i - 1].score < 5 && sortedAwk[i].score === 10) return true;
                }
                return false;

            case "iron_chin":
                let badStreak = 0;
                const sortedIron = [...attempts].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
                for (let a of sortedIron) {
                    if (a.score < 5) {
                        badStreak++;
                    } else if (a.score >= 8 && badStreak >= 3) {
                        return true;
                    } else {
                        badStreak = 0;
                    }
                }
                return false;

            case "diverse_subjects":
                const uniqueExams = new Set(attempts.map(a => a.examId));
                return uniqueExams.size >= badge.rule.value;

            case "near_miss":
                return attempts.some(a => badge.rule.values.includes(Number(a.score)));

            case "fail_then_pass":
                const attemptsByExam = {};
                attempts.forEach(a => {
                    if (!attemptsByExam[a.examId]) attemptsByExam[a.examId] = [];
                    attemptsByExam[a.examId].push(a);
                });
                for (let examId in attemptsByExam) {
                    const sorted = attemptsByExam[examId].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
                    let failed = false;
                    for (let att of sorted) {
                        if (att.score < 5 && att.score !== null) failed = true;
                        else if (failed && att.score >= 5) return true;
                    }
                }
                return false;

            case "consecutive_days":
                if (attempts.length === 0) return false;
                const uniqueDaysList = [...new Set(attempts.map(a => {
                    if (!a.startTime) return null;
                    const d = new Date(a.startTime);
                    d.setHours(0, 0, 0, 0);
                    return d.getTime();
                }).filter(Boolean))].sort((a, b) => a - b);

                if (uniqueDaysList.length < badge.rule.value) return false;

                let dayStreak = 1;
                for (let i = 1; i < uniqueDaysList.length; i++) {
                    const diffDays = Math.round((uniqueDaysList[i] - uniqueDaysList[i - 1]) / (1000 * 60 * 60 * 24));
                    if (diffDays === 1) {
                        dayStreak++;
                        if (dayStreak >= badge.rule.value) return true;
                    } else {
                        dayStreak = 1;
                    }
                }
                return dayStreak >= badge.rule.value;

            case "speed_count":
                const fastAttempts = attempts.filter(a => {
                    if (a.score < badge.rule.minScore) return false;
                    if (!a.startTime || !a.submitTime) return false;
                    const durationMinutes = (new Date(a.submitTime) - new Date(a.startTime)) / (1000 * 60);
                    return durationMinutes > 0 && durationMinutes <= badge.rule.maxMinutes;
                });
                return fastAttempts.length >= badge.rule.count;

            default:
                return false;
        }
    }
};
