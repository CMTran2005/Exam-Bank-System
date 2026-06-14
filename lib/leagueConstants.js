/**
 * @fileoverview Cấu hình các hằng số cho Hệ thống Giải đấu tuần (Weekly Leagues)
 */

export const LEAGUE_GROUP_SIZE = 30;

export const LEAGUE_TIERS = {
    1: { 
        id: 1, 
        nameEn: "Iron", 
        nameVi: "Sắt", 
        promoteTop: 10, 
        demoteBottom: 31, // Sắt không rớt hạng
        color: "text-slate-400", 
        bg: "bg-slate-400" 
    },
    2: { 
        id: 2, 
        nameEn: "Bronze", 
        nameVi: "Đồng", 
        promoteTop: 10, 
        demoteBottom: 26, 
        color: "text-amber-700", 
        bg: "bg-amber-700" 
    },
    3: { 
        id: 3, 
        nameEn: "Silver", 
        nameVi: "Bạc", 
        promoteTop: 10, 
        demoteBottom: 26, 
        color: "text-zinc-400", 
        bg: "bg-zinc-400" 
    },
    4: { 
        id: 4, 
        nameEn: "Gold", 
        nameVi: "Vàng", 
        promoteTop: 10, 
        demoteBottom: 26, 
        color: "text-yellow-400", 
        bg: "bg-yellow-400" 
    },
    
    5: { 
        id: 5, 
        nameEn: "Quartz", 
        nameVi: "Thạch Anh", 
        promoteTop: 7, 
        demoteBottom: 23, 
        color: "text-rose-300", 
        bg: "bg-rose-300" 
    },
    6: { 
        id: 6, 
        nameEn: "Amber", 
        nameVi: "Hổ Phách", 
        promoteTop: 7, 
        demoteBottom: 23, 
        color: "text-amber-500", 
        bg: "bg-amber-500" 
    },
    7: { 
        id: 7, 
        nameEn: "Sapphire", 
        nameVi: "Lam Ngọc", 
        promoteTop: 7, 
        demoteBottom: 23, 
        color: "text-blue-500", 
        bg: "bg-blue-500" 
    },
    
    8: { 
        id: 8, 
        nameEn: "Ruby", 
        nameVi: "Hồng Ngọc", 
        promoteTop: 7, 
        demoteBottom: 23, 
        color: "text-red-500", 
        bg: "bg-red-500" 
    },
    9: { 
        id: 9, 
        nameEn: "Emerald", 
        nameVi: "Ngọc Lục Bảo", 
        promoteTop: 7, 
        demoteBottom: 23, 
        color: "text-emerald-500", 
        bg: "bg-emerald-500" 
    },
    10: { 
        id: 10, 
        nameEn: "Obsidian", 
        nameVi: "Đá Núi Lửa", 
        promoteTop: 5, 
        demoteBottom: 19, 
        color: "text-purple-900 dark:text-purple-700", 
        bg: "bg-purple-900" 
    },
    
    11: { 
        id: 11, 
        nameEn: "Black Pearl", 
        nameVi: "Ngọc Trai Đen", 
        promoteTop: 5, 
        demoteBottom: 19, 
        color: "text-slate-800 dark:text-slate-600", 
        bg: "bg-slate-800" 
    },
    12: { 
        id: 12, 
        nameEn: "Amethyst", 
        nameVi: "Tinh Thể Khói", 
        promoteTop: 5, 
        demoteBottom: 19, 
        color: "text-fuchsia-500", 
        bg: "bg-fuchsia-500" 
    },
    13: { 
        id: 13, 
        nameEn: "Diamond", 
        nameVi: "Kim Cương", 
        promoteTop: 5, 
        demoteBottom: 19, 
        color: "text-cyan-400", 
        bg: "bg-cyan-400" 
    },
    
    14: { 
        id: 14, 
        nameEn: "Meteorite", 
        nameVi: "Thiên Thạch", 
        promoteTop: 1, 
        demoteBottom: 16, 
        color: "text-orange-600", 
        bg: "bg-orange-600" 
    },
    15: { 
        id: 15, 
        nameEn: "Nebula", 
        nameVi: "Tinh Vân", 
        promoteTop: 0, 
        demoteBottom: 11, 
        color: "text-indigo-500", 
        bg: "bg-indigo-500" 
    },
};

/**
 * Tính toán trạng thái thăng/giáng hạng của một học sinh dựa trên thứ hạng (1-based index)
 * @param {number} rank - Xếp hạng (1 đến 30)
 * @param {number} tierId - Cấp bậc hiện tại (1 đến 15)
 * @returns {'promoted' | 'stay' | 'demoted'}
 */
export const getPromotionStatus = (rank, tierId) => {
    const tier = LEAGUE_TIERS[tierId];
    if (!tier) return 'stay';

    if (rank <= tier.promoteTop) return 'promoted';
    if (rank >= tier.demoteBottom) return 'demoted';
    return 'stay';
};
