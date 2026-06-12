"use client";

import { useEffect, useRef, useState } from "react";

/**
 * VirtualizedItem là một component gọn nhẹ giúp trì hoãn việc mount/render
 * các phần tử con cho đến khi chúng chuẩn bị xuất hiện trong viewport.
 * 
 * Giúp tối ưu hóa tốc độ tải trang, Lighthouse Score và hiệu năng cuộn (FPS) 
 * đối với các danh sách lớn (như Ngân hàng câu hỏi, Kết quả bài thi) chứa nhiều 
 * công thức Toán KaTeX hoặc DOM phức tạp.
 * 
 * @param {React.ReactNode} children - Nội dung cần hiển thị
 * @param {number} height - Chiều cao ước lượng ban đầu của phần tử để tránh Layout Shift (mặc định 140px)
 * @param {string} rootMargin - Khoảng cách đệm trước khi kích hoạt hiển thị (mặc định 300px)
 */
export default function VirtualizedItem({ children, height = 140, rootMargin = "300px" }) {
    const [isRendered, setIsRendered] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        // Hỗ trợ fallback nếu trình duyệt cũ không có IntersectionObserver
        if (!window.IntersectionObserver) {
            setIsRendered(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsRendered(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: `${rootMargin} 0px ${rootMargin} 0px`,
                threshold: 0.01,
            }
        );

        const currentRef = containerRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
            observer.disconnect();
        };
    }, [rootMargin]);

    if (!isRendered) {
        return (
            <div
                ref={containerRef}
                style={{ minHeight: `${height}px` }}
                className="w-full bg-card/20 border border-border/40 rounded-2xl animate-pulse"
            />
        );
    }

    return <div ref={containerRef}>{children}</div>;
}
