import { adminDb } from "@/lib/firebaseAdmin";
import { LEAGUE_GROUP_SIZE } from "@/lib/leagueConstants";
import * as admin from 'firebase-admin';

export const getCurrentWeekId = () => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo}`;
};

/**
 * Thêm EXP tuần cho user từ phía Server (Bảo mật tuyệt đối, không thể cheat từ Client)
 * @param {string} userId
 * @param {number} expAmount
 */
export const addWeeklyExpServer = async (userId, expAmount) => {
    if (!userId || expAmount <= 0) return;

    try {
        await adminDb.runTransaction(async (transaction) => {
            const userRef = adminDb.collection("users").doc(userId);
            const userDoc = await transaction.get(userRef);
            
            if (!userDoc.exists) return;

            const userData = userDoc.data();
            const currentRank = userData.leagueRank || 1;
            const currentExp = userData.weeklyExp || 0;
            let groupId = userData.leagueGroupId;
            const weekId = getCurrentWeekId();

            if (!groupId) {
                // Tìm bảng đấu đang mở của Rank này trong tuần này
                const groupsRef = adminDb.collection("leagueGroups");
                const q = groupsRef
                    .where("tierId", "==", currentRank)
                    .where("weekId", "==", weekId)
                    .where("status", "==", "active");
                
                const groupDocs = await q.get();
                
                let availableGroup = null;
                for (const doc of groupDocs.docs) {
                    if ((doc.data().memberCount || 0) < LEAGUE_GROUP_SIZE) {
                        availableGroup = doc;
                        break;
                    }
                }
                
                if (availableGroup) {
                    groupId = availableGroup.id;
                    const groupRef = groupsRef.doc(groupId);
                    
                    transaction.update(groupRef, {
                        memberCount: admin.firestore.FieldValue.increment(1),
                        members: admin.firestore.FieldValue.arrayUnion(userId)
                    });
                } else {
                    // Mở bảng mới nếu chưa có hoặc đã Full
                    const newGroupRef = groupsRef.doc();
                    groupId = newGroupRef.id;
                    transaction.set(newGroupRef, {
                        weekId,
                        tierId: currentRank,
                        status: "active",
                        memberCount: 1,
                        members: [userId],
                        createdAt: new Date().toISOString()
                    });
                }
            }

            // Cập nhật điểm cho User
            transaction.update(userRef, {
                weeklyExp: currentExp + expAmount,
                leagueGroupId: groupId,
                lastExpUpdate: new Date().toISOString()
            });

            // Cập nhật điểm của User trong collection con leaderboard của bảng đấu đó
            const memberRef = adminDb.collection(`leagueGroups/${groupId}/leaderboard`).doc(userId);
            transaction.set(memberRef, {
                userId,
                exp: currentExp + expAmount,
                lastUpdate: new Date().toISOString(),
                displayName: userData.name || userData.displayName || "Học sinh",
                photoURL: userData.photoURL || null
            });
        });
    } catch (error) {
        console.error("Lỗi khi thêm League EXP (Server):", error);
    }
};
