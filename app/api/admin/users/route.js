import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

/**
 * Hàm kiểm tra quyền Admin từ Header Authorization Token
 *
 * @param {Request} request
 * @returns {Promise<Object|null>} - Thông tin giải mã token hoặc null
 */
async function verifyAdmin(request) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }
    const token = authHeader.split("Bearer ")[1];
    if (!adminAuth || !adminDb) {
        return null;
    }

    try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        const uid = decodedToken.uid;
        
        // Kiểm tra vai trò trong Firestore
        const userDoc = await adminDb.collection("users").doc(uid).get();
        if (userDoc.exists && userDoc.data().role === "admin") {
            return decodedToken;
        }
        return null;
    } catch (error) {
        console.error("Lỗi xác thực Admin token:", error);
        return null;
    }
}

/**
 * GET /api/admin/users
 * Lấy danh sách thành viên trong hệ thống
 */
export async function GET(request) {
    const adminToken = await verifyAdmin(request);
    if (!adminToken) {
        return NextResponse.json({ error: "Unauthorized: Admin access required." }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const roleFilter = searchParams.get("role") || "all";
        const statusFilter = searchParams.get("status") || "all";

        let query = adminDb.collection("users");

        if (roleFilter !== "all") {
            query = query.where("role", "==", roleFilter);
        }
        if (statusFilter !== "all") {
            query = query.where("status", "==", statusFilter);
        }

        const snapshot = await query.get();
        const users = [];
        snapshot.forEach(doc => {
            users.push({ uid: doc.id, ...doc.data() });
        });

        // Sắp xếp theo tên hoặc email ở phía Server
        users.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        return NextResponse.json({ success: true, users });
    } catch (error) {
        console.error("Lỗi lấy danh sách users:", error);
        return NextResponse.json({ error: "Lỗi hệ thống khi lấy danh sách người dùng." }, { status: 500 });
    }
}

/**
 * POST /api/admin/users
 * Thao tác quản trị người dùng (phê duyệt, khóa/mở khóa)
 */
export async function POST(request) {
    const adminToken = await verifyAdmin(request);
    if (!adminToken) {
        return NextResponse.json({ error: "Unauthorized: Admin access required." }, { status: 401 });
    }

    try {
        const { action, targetUid } = await request.json();

        if (!action || !targetUid) {
            return NextResponse.json({ error: "Thiếu tham số bắt buộc (action, targetUid)." }, { status: 400 });
        }

        const userRef = adminDb.collection("users").doc(targetUid);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return NextResponse.json({ error: "Không tìm thấy người dùng mục tiêu." }, { status: 404 });
        }

        const userData = userDoc.data();

        if (action === "approve") {
            if (userData.role !== "teacher") {
                return NextResponse.json({ error: "Chỉ được phép phê duyệt tài khoản giáo viên." }, { status: 400 });
            }
            await userRef.update({ status: "active" });
            return NextResponse.json({ success: true, message: "Đã phê duyệt tài khoản giáo viên." });
        } 
        
        if (action === "toggle-status") {
            // Tránh việc tự khóa chính mình
            if (targetUid === adminToken.uid) {
                return NextResponse.json({ error: "Không thể tự khóa tài khoản của chính mình." }, { status: 400 });
            }

            const currentStatus = userData.status || "active";
            const newStatus = currentStatus === "suspended" ? "active" : "suspended";

            // Cập nhật trạng thái trong Firestore
            await userRef.update({ status: newStatus });

            // Vô hiệu hóa hoặc kích hoạt lại tài khoản trong Firebase Authentication
            if (adminAuth) {
                await adminAuth.updateUser(targetUid, {
                    disabled: newStatus === "suspended"
                });
            }

            return NextResponse.json({ 
                success: true, 
                newStatus, 
                message: newStatus === "suspended" ? "Đã khóa tài khoản thành viên." : "Đã kích hoạt lại tài khoản thành viên." 
            });
        }

        return NextResponse.json({ error: "Hành động không hợp lệ." }, { status: 400 });

    } catch (error) {
        console.error("Lỗi cập nhật trạng thái người dùng:", error);
        return NextResponse.json({ error: "Lỗi hệ thống khi cập nhật thông tin người dùng." }, { status: 500 });
    }
}
