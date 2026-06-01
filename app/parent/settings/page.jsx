"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { User, Mail, Save, Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Component ParentSettings
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @returns {JSX.Element}
 */
export default function ParentSettings() {
    const { currentUser } = useAuth();
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name || "");
        }
    }, [currentUser]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Vui lòng nhập họ tên.");
            return;
        }

        setLoading(true);
        try {
            const userRef = doc(db, "users", currentUser.uid);
            await updateDoc(userRef, {
                name: name.trim()
            });
            // Update local state is handled by AuthContext listener typically
            toast.success("Đã cập nhật thông tin thành công!");
        } catch (error) {
            console.error("Lỗi cập nhật:", error);
            toast.error("Không thể cập nhật thông tin.");
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser) return null;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Settings className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-foreground">Cài đặt Tài khoản</h1>
                    <p className="text-sm text-muted-foreground mt-1">Cập nhật thông tin cá nhân của bạn</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" /> Email (Không thể thay đổi)
                        </label>
                        <Input 
                            type="email" 
                            value={currentUser.email} 
                            disabled 
                            className="bg-muted text-muted-foreground border-border"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" /> Họ và Tên
                        </label>
                        <Input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nhập họ và tên của bạn"
                            className="bg-background border-border focus-visible:ring-primary"
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <Button type="submit" disabled={loading} className="font-bold gap-2">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Lưu Thay Đổi
                    </Button>
                </div>
            </form>
        </div>
    );
}
