import { db } from '@/lib/firebase';
import { 
    collection, doc, getDoc, getDocs, setDoc, updateDoc, 
    query, where, limit, runTransaction, serverTimestamp, orderBy, arrayUnion
} from 'firebase/firestore';
import { LEAGUE_GROUP_SIZE, LEAGUE_TIERS, getPromotionStatus } from '@/lib/leagueConstants';

/**
 * Lấy ID của tuần hiện tại (Ví dụ: "2026-W24")
 * @returns {string}
 */
const getCurrentWeekId = () => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo}`;
};

export const leagueService = {
    /**
     * Khởi tạo thông tin league cơ bản cho user nếu chưa có
     * @param {string} userId
     */
    async initUserLeague(userId) {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const data = userSnap.data();
            if (!data.leagueRank) {
                await updateDoc(userRef, {
                    leagueRank: 1, // Sắt
                    weeklyExp: 0,
                    leagueGroupId: null,
                    lastExpUpdate: serverTimestamp()
                });
            }
        }
    },

    /**
     * Thêm EXP tuần cho user. Nếu user chưa có bảng đấu, sẽ tự động phân bảng.
     * @param {string} userId 
     * @param {number} expAmount 
     * @returns {Promise<void>}
     */
    async addWeeklyExp(userId, expAmount) {
        if (!userId || expAmount <= 0) return;

        try {
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, "users", userId);
                const userDoc = await transaction.get(userRef);
                
                if (!userDoc.exists()) return;

                const userData = userDoc.data();
                const currentRank = userData.leagueRank || 1;
                const currentExp = userData.weeklyExp || 0;
                let groupId = userData.leagueGroupId;
                const weekId = getCurrentWeekId();

                // Nếu user chưa có bảng đấu (vừa qua tuần mới hoặc mới tạo)
                if (!groupId) {
                    // Tìm bảng đấu đang mở
                    const groupsRef = collection(db, "leagueGroups");
                    const q = query(
                        groupsRef, 
                        where("tierId", "==", currentRank),
                        where("weekId", "==", weekId),
                        where("status", "==", "active")
                    );
                    const groupDocs = await getDocs(q); // Lấy bảng đấu (không dùng qua transaction vì giới hạn)
                    
                    let availableGroup = null;
                    for (const doc of groupDocs.docs) {
                        if ((doc.data().memberCount || 0) < LEAGUE_GROUP_SIZE) {
                            availableGroup = doc;
                            break;
                        }
                    }

                    if (availableGroup) {
                        groupId = availableGroup.id;
                        const groupRef = doc(db, "leagueGroups", groupId);
                        // Cập nhật bảng đấu
                        transaction.update(groupRef, {
                            memberCount: (availableGroup.data().memberCount || 0) + 1,
                            members: arrayUnion(userId)
                        });
                    } else {
                        // Tạo bảng mới
                        const newGroupRef = doc(collection(db, "leagueGroups"));
                        groupId = newGroupRef.id;
                        transaction.set(newGroupRef, {
                            weekId,
                            tierId: currentRank,
                            status: "active",
                            memberCount: 1,
                            members: [userId],
                            createdAt: serverTimestamp()
                        });
                    }
                }

                // Cập nhật user
                transaction.update(userRef, {
                    weeklyExp: currentExp + expAmount,
                    leagueGroupId: groupId,
                    lastExpUpdate: serverTimestamp()
                });

                // Cập nhật điểm của user trong collection con của group để query leaderboard nhanh
                const memberRef = doc(db, `leagueGroups/${groupId}/leaderboard`, userId);
                transaction.set(memberRef, {
                    userId,
                    exp: currentExp + expAmount,
                    lastUpdate: new Date().toISOString(),
                    displayName: userData.name || userData.displayName || "Học sinh",
                    photoURL: userData.photoURL || null
                });
            });
        } catch (error) {
            console.error("Lỗi khi thêm League EXP:", error);
            throw error;
        }
    },

    /**
     * Lấy danh sách bảng xếp hạng của một bảng đấu
     * @param {string} groupId 
     */
    async getGroupLeaderboard(groupId) {
        if (!groupId) return [];
        
        const q = query(
            collection(db, `leagueGroups/${groupId}/leaderboard`),
            orderBy("exp", "desc")
        );

        const snap = await getDocs(q);
        let members = snap.docs.map(doc => doc.data());
        
        // Xử lý bằng điểm: Người cập nhật điểm trước (lastUpdate nhỏ hơn) sẽ xếp trên
        members.sort((a, b) => {
            if (b.exp !== a.exp) return b.exp - a.exp;
            return new Date(a.lastUpdate) - new Date(b.lastUpdate);
        });

        // Fetch showcasedBadges từ collection users
        const userIds = members.map(m => m.userId);
        if (userIds.length > 0) {
            // Firestore 'in' query supports up to 10 items, but we can just fetch all in parallel with getDoc
            // Mảng nhỏ (max 30 người) nên có thể Promise.all an toàn
            const userPromises = members.map(m => getDoc(doc(db, "users", m.userId)));
            const userDocs = await Promise.all(userPromises);
            
            members = members.map((m, index) => {
                const uDoc = userDocs[index];
                if (uDoc.exists()) {
                    return { ...m, showcasedBadges: uDoc.data().showcasedBadges || [] };
                }
                return { ...m, showcasedBadges: [] };
            });
        }

        return members;
    },

    /**
     * Lấy thông tin user hiện tại trong league
     * @param {string} userId 
     */
    async getUserLeagueInfo(userId) {
        const docRef = doc(db, "users", userId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return null;

        const data = snap.data();
        return {
            leagueRank: data.leagueRank || 1,
            weeklyExp: data.weeklyExp || 0,
            leagueGroupId: data.leagueGroupId || null,
        };
    }
};
