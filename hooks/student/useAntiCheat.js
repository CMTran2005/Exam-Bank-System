import { useEffect } from "react";
import { examAttemptService } from "@/services/examAttemptService";

/**
 * Hook giám sát và chống gian lận (Anti-cheat) trong quá trình làm bài thi
 * 
 * @param {boolean} isSubmitting - Trạng thái đang nộp bài
 * @param {number|null} timeLeft - Thời gian còn lại
 * @param {Object} attempt - Đối tượng chứa thông tin phiên làm bài hiện tại
 */
export function useAntiCheat(isSubmitting, timeLeft, attempt) {
    useEffect(() => {
        if (isSubmitting || timeLeft <= 0 || !attempt) return;

        // Cơ chế 1: Phát hiện hành vi chuyển tab trình duyệt (Visibility API)
        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                examAttemptService.logCheat(attempt.id, "Chuyển Tab (Ẩn trình duyệt)");
            }
        };

        // Cơ chế 2: Phát hiện hành vi mất tiêu điểm (Chuyển cửa sổ hoặc ứng dụng khác)
        const handleBlur = () => {
            examAttemptService.logCheat(attempt.id, "Mất Focus (Mở ứng dụng khác)");
        };

        // Cơ chế 3: Vô hiệu hóa các phím tắt sao chép và xem mã nguồn
        const handleContextMenu = (e) => e.preventDefault();
        const handleCopyPaste = (e) => e.preventDefault();

        const handleKeyDown = (e) => {
            // Vô hiệu hóa các công cụ dành cho nhà phát triển (DevTools)
            if (
                e.key === "F12" ||
                (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) ||
                (e.ctrlKey && e.key === "U") ||
                (e.ctrlKey && e.key === "P") || // Vô hiệu hóa tính năng In ấn
                (e.ctrlKey && e.key === "C") || // Vô hiệu hóa tính năng Sao chép
                (e.ctrlKey && e.key === "V")    // Vô hiệu hóa tính năng Dán
            ) {
                e.preventDefault();
                examAttemptService.logCheat(attempt.id, "Cố tình dùng phím tắt cấm");
            }
        };

        // Cơ chế 4: Giám sát DOM để phát hiện các tiện ích mở rộng can thiệp (Extension Detect)
        const observer = new MutationObserver((mutations) => {
            let suspiciousInjected = false;
            for (let mutation of mutations) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const tag = node.tagName.toLowerCase();
                        const id = node.id ? node.id.toLowerCase() : "";
                        const cls = (typeof node.className === 'string') ? node.className.toLowerCase() : "";

                        // Phát hiện các Web Components lạ lọt vào (thường chứa dấu gạch ngang)
                        // Loại trừ các class hệ thống hợp lệ của TailwindCSS
                        if (
                            tag === "iframe" ||
                            (tag.includes("-") && !tag.includes("lucide")) ||
                            id.includes("sider") || id.includes("grammarly") || id.includes("chatgpt") ||
                            (cls.includes("sider") && !cls.includes("slider")) ||
                            cls.includes("grammarly") ||
                            cls.includes("extension-")
                        ) {
                            suspiciousInjected = true;
                            // Ẩn phần tử bị can thiệp để vô hiệu hóa tiện ích mở rộng
                            node.style.display = 'none';
                        }
                    }
                });
            }
            if (suspiciousInjected) {
                examAttemptService.logCheat(attempt.id, "Phát hiện tiện ích mở rộng (Extension) can thiệp");
            }
        });

        // Kích hoạt toàn bộ trình lắng nghe sự kiện (Event Listeners)
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);
        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("copy", handleCopyPaste);
        document.addEventListener("cut", handleCopyPaste);
        document.addEventListener("paste", handleCopyPaste);
        document.addEventListener("keydown", handleKeyDown);

        // Kích hoạt giám sát biến đổi DOM (MutationObserver)
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            // Giải phóng tài nguyên và các trình lắng nghe khi component bị gỡ (unmount)
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("copy", handleCopyPaste);
            document.removeEventListener("cut", handleCopyPaste);
            document.removeEventListener("paste", handleCopyPaste);
            document.removeEventListener("keydown", handleKeyDown);
            observer.disconnect();
        };
    }, [isSubmitting, timeLeft, attempt]);
}
