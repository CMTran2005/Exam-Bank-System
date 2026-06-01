"use client";

import { useState, useEffect } from "react";
import { STATIC_PROVINCES } from "@/lib/constants";

/**
 * Hàm useProvinces
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @returns {any}
 */
export default function useProvinces() {
    const [provinces, setProvinces] = useState(STATIC_PROVINCES);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                // Bước 1: Kiểm tra Cache trong bộ nhớ cục bộ (localStorage) để tối ưu hóa tốc độ tải trang
                const cached = localStorage.getItem("eb_provinces_cache");
                if (cached) {
                    setProvinces(JSON.parse(cached));
                    setLoading(false);
                    // Tiếp tục gọi API ngầm để cập nhật dữ liệu mới nếu có thay đổi (Cơ chế Stale-While-Revalidate)
                }

                // Bước 2: Gọi API công khai để lấy danh sách Tỉnh/Thành phố Việt Nam
                const res = await fetch("https://provinces.open-api.vn/api/?depth=1");
                if (!res.ok) {
                    throw new Error("Lỗi kết nối máy chủ API Tỉnh thành");
                }
                const data = await res.json();

                if (Array.isArray(data) && data.length > 0) {
                    // Chuẩn hóa tên tỉnh thành (Ví dụ: "Thành phố Hà Nội" -> "Hà Nội", "Tỉnh Nghệ An" -> "Nghệ An")
                    const formatted = data.map((p) => {
                        return p.name
                            .replace("Thành phố ", "TP. ")
                            .replace("Tỉnh ", "");
                    });

                    // Sắp xếp danh sách theo thứ tự bảng chữ cái Tiếng Việt
                    formatted.sort((a, b) => a.localeCompare(b, "vi"));

                    // Bổ sung tùy chọn "Toàn quốc" vào đầu danh sách làm giá trị mặc định
                    const finalProvinces = ["Toàn quốc", ...formatted.filter(p => p !== "Toàn quốc")];

                    // Lưu kết quả vào Cache để sử dụng cho các lần tải sau
                    localStorage.setItem("eb_provinces_cache", JSON.stringify(finalProvinces));
                    setProvinces(finalProvinces);
                }
            } catch (err) {
                console.warn("Không thể tải tỉnh thành từ API, sử dụng dữ liệu tĩnh fallback offline:", err);
                setError(err.message);
                // Sử dụng danh sách tĩnh STATIC_PROVINCES (trong constants) làm phương án dự phòng nếu gọi API thất bại
            } finally {
                setLoading(false);
            }
        };

        fetchProvinces();
    }, []);

    return { provinces, loading, error };
}
