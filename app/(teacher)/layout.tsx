import AppLayout from "@/components/layout/AppLayout";

export default function TeacherLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return <AppLayout>{children}</AppLayout>;
  }
