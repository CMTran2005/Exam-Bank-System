import useSWR from "swr";
import { studentService } from "@/services/studentService";
import { toast } from "sonner";

/**
 * Hàm useClasses
 * Xử lý logic và chức năng liên quan.
 *
 * @param {any} currentUser - Tham số đầu vào
 * @returns {any}
 */
export function useClasses(currentUser) {
    const fetcher = async (uid) => {
        try {
            return await studentService.getJoinedClasses(uid);
        } catch (error) {
            console.error(error);
            toast.error("Không thể tải danh sách lớp học.");
            throw error;
        }
    };

    const { data, error, isLoading, mutate } = useSWR(
        currentUser?.uid ? `classes_${currentUser.uid}` : null,
        () => fetcher(currentUser.uid),
        {
            revalidateOnFocus: false, // Vô hiệu hóa tính năng gọi lại API khi chuyển tab (focus lại cửa sổ)
            dedupingInterval: 60000, // Sử dụng bộ nhớ đệm (cache) trong khoảng thời gian 60 giây
        }
    );

    return { 
        classes: data || [], 
        loading: isLoading, 
        loadClasses: mutate // Hàm ép buộc SWR tải lại dữ liệu từ máy chủ ngay lập tức
    };
}
