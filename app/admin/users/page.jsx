"use client";

import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
    Users, Search, UserCheck, ShieldAlert, ShieldCheck,
    Filter, RefreshCw, Lock, Unlock, CheckCircle, GraduationCap,
    BookOpen, BarChart3, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Trang Quản Lý Thành Viên (Chỉ Admin mới được truy cập)
 * Tích hợp đầy đủ logic kiểm tra quyền, duyệt giáo viên, khóa/mở khóa tài khoản.
 */
export default function AdminUsersPage() {
    const { currentUser, loading } = useAuth();
    const router = useRouter();

    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRole, setSelectedRole] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [activeTab, setActiveTab] = useState("pending");
    const [actionLoading, setActionLoading] = useState(null);

    // States cho Custom Alert Dialog (Khóa/Mở khóa)
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmUser, setConfirmUser] = useState(null); // { uid, status, name, email }

    // Guard checking
    useEffect(() => {
        if (!loading) {
            if (!currentUser) {
                router.push("/login");
            } else if (currentUser.role !== "admin") {
                router.push("/");
            }
        }
    }, [currentUser, loading, router]);

    // Hàm gọi API lấy danh sách users
    const fetchUsers = useCallback(async () => {
        setLoadingUsers(true);
        try {
            const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
            if (!token) return;

            const res = await fetch(`/api/admin/users?role=${selectedRole}&status=${selectedStatus}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setUsers(data.users || []);

                // Nếu không có giáo viên nào chờ duyệt, chuyển sang tab tất cả
                const pendingCount = (data.users || []).filter(u => u.status === "pending").length;
                if (pendingCount === 0 && activeTab === "pending") {
                    setActiveTab("all");
                }
            } else {
                toast.error(data.error || "Không thể tải danh sách người dùng.");
            }
        } catch (error) {
            console.error("Lỗi fetch users:", error);
            toast.error("Lỗi kết nối máy chủ khi tải danh sách.");
        } finally {
            setLoadingUsers(false);
        }
    }, [selectedRole, selectedStatus, activeTab]);

    useEffect(() => {
        if (currentUser && currentUser.role === "admin") {
            fetchUsers();
        }
    }, [currentUser, fetchUsers]);

    // Xử lý Phê duyệt Giáo viên
    const handleApprove = async (uid) => {
        setActionLoading(uid);
        try {
            const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: "approve",
                    targetUid: uid
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(data.message || "Đã phê duyệt giáo viên thành công!");
                // Cập nhật state cục bộ
                setUsers(prev => prev.map(u => u.uid === uid ? { ...u, status: "active" } : u));
            } else {
                toast.error(data.error || "Không thể phê duyệt.");
            }
        } catch (error) {
            toast.error("Lỗi kết nối khi gửi yêu cầu duyệt.");
        } finally {
            setActionLoading(null);
        }
    };

    // Mở popup xác nhận khóa/mở khóa
    const openConfirmDialog = (user) => {
        setConfirmUser(user);
        setConfirmOpen(true);
    };

    // Thực hiện Khóa / Mở khóa sau khi xác nhận trên Custom Modal
    const handleConfirmToggle = async () => {
        if (!confirmUser) return;
        const { uid, status, name, email } = confirmUser;
        const actionLabel = status === "suspended" ? "mở khóa" : "khóa";

        setActionLoading(uid);
        setConfirmOpen(false);
        try {
            const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: "toggle-status",
                    targetUid: uid
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(data.message || `Đã ${actionLabel} tài khoản thành công!`);
                // Cập nhật state cục bộ
                setUsers(prev => prev.map(u => u.uid === uid ? { ...u, status: data.newStatus } : u));
            } else {
                toast.error(data.error || "Thao tác thất bại.");
            }
        } catch (error) {
            toast.error("Lỗi kết nối khi gửi yêu cầu khóa/mở khóa.");
        } finally {
            setActionLoading(null);
            setConfirmUser(null);
        }
    };

    // Thống kê số lượng
    const stats = {
        pending: users.filter(u => u.status === "pending" && u.role === "teacher").length,
        teachers: users.filter(u => u.role === "teacher" && u.status === "active").length,
        students: users.filter(u => u.role === "student").length,
        suspended: users.filter(u => u.status === "suspended").length,
    };

    // Bộ lọc hiển thị theo tìm kiếm & tab active
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            (user.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.email || "").toLowerCase().includes(searchQuery.toLowerCase());

        if (activeTab === "pending") {
            return matchesSearch && user.status === "pending" && user.role === "teacher";
        }

        return matchesSearch;
    });

    if (loading || !currentUser || currentUser.role !== "admin") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-muted-foreground font-medium animate-pulse">Đang tải trang quản trị...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 border-b border-border/60 pb-6">
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                        <Users className="w-6 h-6 text-indigo-500" />
                        Quản lý Thành viên
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
                        Phê duyệt các tài khoản giáo viên mới đăng ký, xem danh sách toàn bộ học sinh, phụ huynh và kiểm soát trạng thái hoạt động của các thành viên.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        onClick={fetchUsers}
                        variant="outline"
                        size="sm"
                        disabled={loadingUsers}
                        className="rounded-xl h-10 gap-2 border-border"
                    >
                        <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
                        Làm mới
                    </Button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border border-border/60 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-black">{stats.pending}</p>
                        <p className="text-xs text-muted-foreground font-medium">Chờ phê duyệt</p>
                    </div>
                </div>
                <div className="bg-card border border-border/60 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                    <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-black">{stats.teachers}</p>
                        <p className="text-xs text-muted-foreground font-medium">Giáo viên active</p>
                    </div>
                </div>
                <div className="bg-card border border-border/60 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-black">{stats.students}</p>
                        <p className="text-xs text-muted-foreground font-medium">Học sinh</p>
                    </div>
                </div>
                <div className="bg-card border border-border/60 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                    <div className="h-12 w-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                        <Lock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-black">{stats.suspended}</p>
                        <p className="text-xs text-muted-foreground font-medium">Tài khoản bị khóa</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs & Filters */}
            <div className="space-y-4">
                <div className="flex border-b border-border/80 gap-6">
                    <button
                        onClick={() => setActiveTab("pending")}
                        className={`pb-3 text-sm font-bold transition-all relative ${activeTab === "pending"
                                ? "text-indigo-600 dark:text-indigo-400 font-extrabold"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Chờ duyệt giáo viên ({stats.pending})
                        {activeTab === "pending" && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("all")}
                        className={`pb-3 text-sm font-bold transition-all relative ${activeTab === "all"
                                ? "text-indigo-600 dark:text-indigo-400 font-extrabold"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Tất cả thành viên ({users.length})
                        {activeTab === "all" && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                        )}
                    </button>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Search Bar */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm theo tên, email..."
                            className="pl-9 h-10 rounded-xl border-border bg-background focus-visible:ring-indigo-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Filter Dropdowns (Only active for 'Tất cả thành viên' tab) */}
                    {activeTab === "all" && (
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                <Filter className="w-3.5 h-3.5" /> Bộ lọc:
                            </div>
                            
                            {/* Cải thiện Dropdown chọn Vai trò */}
                            <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val)}>
                                <SelectTrigger className="w-[160px] h-9 rounded-xl border-border bg-background text-xs font-bold focus:ring-1 focus:ring-indigo-500">
                                    <SelectValue placeholder="Chọn vai trò" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả vai trò</SelectItem>
                                    <SelectItem value="admin">Quản trị viên</SelectItem>
                                    <SelectItem value="teacher">Giáo viên</SelectItem>
                                    <SelectItem value="student">Học sinh</SelectItem>
                                    <SelectItem value="parent">Phụ huynh</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Cải thiện Dropdown chọn Trạng thái */}
                            <Select value={selectedStatus} onValueChange={(val) => setSelectedStatus(val)}>
                                <SelectTrigger className="w-[160px] h-9 rounded-xl border-border bg-background text-xs font-bold focus:ring-1 focus:ring-indigo-500">
                                    <SelectValue placeholder="Chọn trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                    <SelectItem value="active">Đang hoạt động</SelectItem>
                                    <SelectItem value="pending">Chờ phê duyệt</SelectItem>
                                    <SelectItem value="suspended">Đã bị khóa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </div>

            {/* Users Table / List */}
            {loadingUsers ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="bg-card border border-border/40 p-4 rounded-2xl flex items-center justify-between">
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-3 w-60" />
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="h-9 w-20 rounded-lg" />
                                <Skeleton className="h-9 w-9 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredUsers.length > 0 ? (
                <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border/80 bg-muted/40 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    <th className="px-6 py-4">Thành viên</th>
                                    <th className="px-6 py-4">Vai trò</th>
                                    <th className="px-6 py-4">Trạng thái</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60 text-sm">
                                {filteredUsers.map((user) => (
                                    <tr key={user.uid} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm">
                                                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground">{user.name || "Không rõ tên"}</p>
                                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getRoleBadge(user.role)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(user.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                {user.status === "pending" && user.role === "teacher" && (
                                                    <Button
                                                        onClick={() => handleApprove(user.uid)}
                                                        disabled={actionLoading === user.uid}
                                                        size="sm"
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 rounded-lg gap-1.5 shadow-sm"
                                                    >
                                                        <UserCheck className="w-4 h-4" />
                                                        Phê duyệt
                                                    </Button>
                                                )}
                                                {user.role !== "admin" && (
                                                    <Button
                                                        onClick={() => openConfirmDialog(user)}
                                                        disabled={actionLoading === user.uid}
                                                        variant="outline"
                                                        size="sm"
                                                        className={`h-9 w-9 p-0 rounded-lg border-border hover:bg-muted ${user.status === "suspended"
                                                                ? "text-emerald-600 hover:text-emerald-700"
                                                                : "text-red-500 hover:text-red-600"
                                                            }`}
                                                        title={user.status === "suspended" ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                                                    >
                                                        {user.status === "suspended" ? (
                                                            <Unlock className="w-4 h-4" />
                                                        ) : (
                                                            <Lock className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card List */}
                    <div className="md:hidden divide-y divide-border/60">
                        {filteredUsers.map((user) => (
                            <div key={user.uid} className="p-4 space-y-4 hover:bg-muted/10 transition-colors">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm shrink-0">
                                            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground leading-snug">{user.name || "Không rõ tên"}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        {getRoleBadge(user.role)}
                                        {getStatusBadge(user.status)}
                                    </div>
                                </div>
                                {((user.status === "pending" && user.role === "teacher") || user.role !== "admin") && (
                                    <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                                        {user.status === "pending" && user.role === "teacher" && (
                                            <Button
                                                onClick={() => handleApprove(user.uid)}
                                                disabled={actionLoading === user.uid}
                                                size="sm"
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 rounded-lg gap-1.5 flex-1 shadow-sm"
                                            >
                                                <UserCheck className="w-4 h-4" />
                                                Phê duyệt giáo viên
                                            </Button>
                                        )}
                                        {user.role !== "admin" && (
                                            <Button
                                                onClick={() => openConfirmDialog(user)}
                                                disabled={actionLoading === user.uid}
                                                variant="outline"
                                                size="sm"
                                                className={`h-9 rounded-lg border-border hover:bg-muted px-3 gap-1.5 ${user.status === "suspended"
                                                        ? "text-emerald-600 hover:text-emerald-700"
                                                        : "text-red-500 hover:text-red-600"
                                                    }`}
                                            >
                                                {user.status === "suspended" ? (
                                                    <>
                                                        <Unlock className="w-4 h-4" /> Mở khóa
                                                    </>
                                                ) : (
                                                    <>
                                                        <Lock className="w-4 h-4" /> Khóa tài khoản
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="py-16 text-center bg-card border border-dashed border-border rounded-2xl">
                    <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-foreground">Không tìm thấy thành viên nào</h3>
                    <p className="text-xs text-muted-foreground mt-1">Hãy thử đổi bộ lọc tìm kiếm hoặc từ khóa khác.</p>
                </div>
            )}

            {/* Custom AlertDialog - thay thế thông báo native confirm của trình duyệt */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                            {confirmUser?.status === "suspended" ? (
                                <>
                                    <Unlock className="w-5 h-5 text-emerald-500" />
                                    Mở khóa tài khoản?
                                </>
                            ) : (
                                <>
                                    <Lock className="w-5 h-5 text-red-500" />
                                    Khóa tài khoản?
                                </>
                            )}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-muted-foreground mt-1">
                            {confirmUser?.status === "suspended" ? (
                                <>Bạn có chắc chắn muốn mở khóa cho tài khoản <strong>{confirmUser?.name || confirmUser?.email}</strong>? Người dùng sẽ khôi phục lại toàn bộ quyền truy cập hệ thống.</>
                            ) : (
                                <>Bạn có chắc chắn muốn khóa tài khoản <strong>{confirmUser?.name || confirmUser?.email}</strong>? Người dùng này sẽ bị chặn truy cập ngay lập tức ở tất cả các portal.</>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmToggle}
                            className={`rounded-xl font-bold ${
                                confirmUser?.status === "suspended"
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                    : "bg-red-600 hover:bg-red-700 text-white"
                            }`}
                        >
                            Xác nhận
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// Helpers for badges styling
function getRoleBadge(role) {
    switch (role) {
        case "admin":
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300">
                    <ShieldCheck className="w-3 h-3" /> Admin
                </span>
            );
        case "teacher":
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    Giáo viên
                </span>
            );
        case "student":
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300">
                    Học sinh
                </span>
            );
        case "parent":
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    Phụ huynh
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                    Khách
                </span>
            );
    }
}

function getStatusBadge(status) {
    switch (status) {
        case "active":
            return (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400">
                    Hoạt động
                </span>
            );
        case "pending":
            return (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400">
                    Chờ duyệt
                </span>
            );
        case "suspended":
            return (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400">
                    Bị khóa
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800 dark:bg-gray-950/20 dark:text-gray-400">
                    Chưa xác định
                </span>
            );
    }
}
