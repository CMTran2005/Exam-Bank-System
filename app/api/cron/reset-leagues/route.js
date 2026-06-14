import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { LEAGUE_TIERS, getPromotionStatus } from "@/lib/leagueConstants";

export const dynamic = 'force-dynamic';

export async function GET(request) {
    // Bảo mật: Đảm bảo chỉ có dịch vụ Cron (Vercel Cron) hoặc Admin có Secret Key mới gọi được API này
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        console.log("Bắt đầu chạy Cronjob Tổng kết Giải Đấu Tuần...");
        const batches = [];
        let currentBatch = adminDb.batch();
        let operationCount = 0;

        const commitBatch = async () => {
            if (operationCount > 0) {
                batches.push(currentBatch.commit());
                currentBatch = adminDb.batch();
                operationCount = 0;
            }
        };

        const addOp = async () => {
            operationCount++;
            if (operationCount === 490) {
                await commitBatch();
            }
        };

        // 1. Lấy tất cả bảng đấu đang "active"
        const groupsSnap = await adminDb.collection("leagueGroups").where("status", "==", "active").get();

        for (const groupDoc of groupsSnap.docs) {
            const groupId = groupDoc.id;
            const groupData = groupDoc.data();
            const tierId = groupData.tierId || 1;

            // Đóng bảng đấu
            currentBatch.update(groupDoc.ref, { status: "finished" });
            await addOp();

            // Lấy leaderboard của bảng
            const leaderboardSnap = await adminDb.collection(`leagueGroups/${groupId}/leaderboard`)
                .orderBy("exp", "desc")
                .get();

            let members = leaderboardSnap.docs.map(doc => ({ id: doc.id, ref: doc.ref, data: doc.data() }));
            
            // Sắp xếp lại in-memory để xử lý bằng điểm
            members.sort((a, b) => {
                if (b.data.exp !== a.data.exp) return b.data.exp - a.data.exp;
                return new Date(a.data.lastUpdate) - new Date(b.data.lastUpdate);
            });

            let rank = 1;
            for (const member of members) {
                const userId = member.id;
                const memberDocRef = member.ref;
                const status = getPromotionStatus(rank, tierId);

                let newRank = tierId;
                if (status === 'promoted' && tierId < 15) {
                    newRank = tierId + 1;
                } else if (status === 'demoted' && tierId > 1) {
                    newRank = tierId - 1;
                }

                // Reset tuần mới cho user
                const userRef = adminDb.collection("users").doc(userId);
                currentBatch.update(userRef, {
                    leagueRank: newRank,
                    weeklyExp: 0,
                    leagueGroupId: null // Bắt đầu tuần mới chưa chia bảng
                });
                await addOp();

                // Lưu lại kết quả vào thành tích tuần của bảng đấu để sau này tra cứu
                currentBatch.update(memberDocRef, {
                    finalRank: rank,
                    promotionStatus: status
                });
                await addOp();

                rank++;
            }
        }

        // 2. Xử lý những "Học sinh ngủ đông" (Không kiếm được EXP nào trong tuần, weeklyExp == 0)
        // Những user này không nằm trong bất kỳ bảng đấu nào (leagueGroupId == null)
        const inactiveUsersSnap = await adminDb.collection("users").where("weeklyExp", "==", 0).get();
        for (const userDoc of inactiveUsersSnap.docs) {
            const userData = userDoc.data();
            const currentRank = userData.leagueRank || 1;
            
            // Giáng 1 hạng nếu đang ở rank cao hơn Sắt (1)
            if (currentRank > 1) {
                currentBatch.update(userDoc.ref, {
                    leagueRank: currentRank - 1,
                    // Giữ nguyên weeklyExp là 0 và leagueGroupId là null
                });
                await addOp();
            }
        }

        // Commit những operations cuối cùng
        await commitBatch();
        await Promise.all(batches);

        console.log("Hoàn tất tổng kết League.");
        return NextResponse.json({ success: true, message: "Leagues have been successfully reset." });
    } catch (error) {
        console.error("Lỗi Cronjob Reset League:", error);
        return NextResponse.json({ error: "Failed to reset leagues." }, { status: 500 });
    }
}
