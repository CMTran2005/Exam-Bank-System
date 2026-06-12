import AppLayout from "@/components/layout/AppLayout";

/**
 * Component AdminLayout
 * Đảm bảo các trang thuộc quyền quản trị (admin) có đầy đủ sidebar, header và footer
 * như giao diện của Giáo viên.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element}
 */
export default function AdminLayout({ children }) {
    return <AppLayout>{children}</AppLayout>;
}
