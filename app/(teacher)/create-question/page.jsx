"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { examCollaborationService } from "@/services/examCollaborationService";
import { Loader2 } from "lucide-react";

/**
 * Component CreateQuestionRoot
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @returns {JSX.Element}
 */
export default function CreateQuestionRoot() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { currentUser, loading } = useAuth();
    
    useEffect(() => {
        if (!currentUser || loading) return;
        
        let isMounted = true;
        const editId = searchParams.get("editId");
        
        const initSession = async () => {
            try {
                if (editId) {
                    if (isMounted) router.replace(`/create-question/${editId}`);
                    return;
                }
                const examId = await examCollaborationService.createDraftSession(currentUser.uid);
                if (isMounted) {
                    router.replace(`/create-question/${examId}`);
                }
            } catch (err) {
                console.error("Lỗi khi tạo/mở phiên soạn thảo:", err);
            }
        };
        
        initSession();
        return () => { isMounted = false; };
    }, [currentUser, loading, router]);

    return (
        <div className="flex items-center justify-center h-[80vh]">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium">Đang khởi tạo không gian soạn thảo chung...</p>
            </div>
        </div>
    );
}
