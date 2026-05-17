import { BookOpen, ExternalLink, Mail } from "lucide-react";

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-border bg-background mt-auto">
            <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">

                <div className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-4 w-4 shrink-0" />
                    <span className="text-xs">
                        © {year}{" "}
                        <span className="font-semibold text-foreground">Ngân Hàng Câu Hỏi Thi</span>
                        {" "}— Hệ thống quản lý đề thi chuyên nghiệp
                    </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <a
                        href="mailto:cmtran2005@gmail.com"
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                        <Mail className="h-3.5 w-3.5" />
                        <span>Hỗ trợ</span>
                    </a>
                    <a
                        href="https://github.com/CMTran2005"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>GitHub</span>
                    </a>
                    <span className="text-border">|</span>
                    <span>v1.0.0</span>
                </div>

            </div>
        </footer>
    );
}
