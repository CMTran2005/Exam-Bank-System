import { User, Sliders, Cpu, Paintbrush } from "lucide-react";

/**
 * Component SettingsSidebar
 * Xử lý logic và chức năng liên quan.
 *
 * @param {any}  activeTab - Tham số đầu vào
 * @returns {JSX.Element}
 */
export function SettingsSidebar({ activeTab, setActiveTab }) {
    return (
        <div className="md:col-span-1 bg-card border border-border shadow-sm rounded-2xl p-2 flex flex-row md:flex-col gap-1 overflow-x-auto">
            <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${activeTab === "profile"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
            >
                <User className="w-4 h-4 shrink-0" />
                <span>Hồ sơ cá nhân</span>
            </button>
            <button
                type="button"
                onClick={() => setActiveTab("exam")}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${activeTab === "exam"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
            >
                <Sliders className="w-4 h-4 shrink-0" />
                <span>Mặc định đề thi</span>
            </button>
            <button
                type="button"
                onClick={() => setActiveTab("ai")}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${activeTab === "ai"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
            >
                <Cpu className="w-4 h-4 shrink-0" />
                <span>Trợ lý AI & OCR</span>
            </button>
            <button
                type="button"
                onClick={() => setActiveTab("display")}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${activeTab === "display"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
            >
                <Paintbrush className="w-4 h-4 shrink-0" />
                <span>Hiển thị & Giao diện</span>
            </button>
        </div>
    );
}
