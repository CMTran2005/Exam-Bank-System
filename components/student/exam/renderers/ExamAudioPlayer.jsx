"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Headphones, Volume2, AlertCircle } from "lucide-react";

/**
 * Component ExamAudioPlayer
 * Trình phát âm thanh tùy chỉnh cho giao diện học sinh, hỗ trợ giới hạn số lần nghe.
 */
export default function ExamAudioPlayer({ src, maxPlaybacks = null, title = "Bài nghe" }) {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [playCount, setPlayCount] = useState(0);
    const [isLocked, setIsLocked] = useState(false);

    // Xử lý logic khi bắt đầu nghe
    const togglePlay = () => {
        if (isLocked) return;
        
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            // Nếu là lần đầu tiên nghe hoặc nghe lại từ đầu
            if (currentTime === 0 && !isPlaying && (maxPlaybacks === null || playCount < maxPlaybacks)) {
                // Đang bắt đầu một lượt nghe mới
            }
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    // Cập nhật tiến trình
    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const dur = audioRef.current.duration;
            setCurrentTime(current);
            setDuration(dur);
            setProgress((current / dur) * 100);
        }
    };

    // Khi bài nghe kết thúc
    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        
        const newCount = playCount + 1;
        setPlayCount(newCount);

        // Khóa nếu đã nghe đủ số lần
        if (maxPlaybacks !== null && newCount >= maxPlaybacks) {
            setIsLocked(true);
        }
    };

    // Định dạng thời gian (mm:ss)
    const formatTime = (time) => {
        if (isNaN(time)) return "00:00";
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Lắng nghe sự kiện bàn phím để chống tua (Prevent keyboard shortcuts)
    useEffect(() => {
        const preventCheat = (e) => {
            if (e.code === "Space" && e.target === document.body) {
                e.preventDefault(); // Chặn dùng phím cách để play/pause bừa bãi
            }
        };
        window.addEventListener("keydown", preventCheat);
        return () => window.removeEventListener("keydown", preventCheat);
    }, []);

    const remainingPlays = maxPlaybacks !== null ? maxPlaybacks - playCount : "∞";

    return (
        <div className={`w-full mt-4 p-4 rounded-xl border transition-all duration-300 ${isLocked ? 'bg-muted border-border' : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 shadow-sm'}`}>
            <audio 
                ref={audioRef} 
                src={src} 
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onLoadedMetadata={handleTimeUpdate}
                preload="metadata"
                controlsList="nodownload noplaybackrate" // Ngăn tải xuống và đổi tốc độ
                className="hidden"
            />
            
            <div className="flex items-center gap-4">
                {/* Nút Play/Pause */}
                <button 
                    onClick={togglePlay}
                    disabled={isLocked}
                    className={`shrink-0 flex items-center justify-center w-12 h-12 rounded-full transition-all ${
                        isLocked 
                            ? 'bg-muted-foreground/20 text-muted-foreground cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95'
                    }`}
                >
                    {isPlaying ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5 ml-1" fill="currentColor" />}
                </button>

                <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Headphones className={`w-4 h-4 ${isLocked ? 'text-muted-foreground' : 'text-blue-600 dark:text-blue-400'}`} />
                            <span className={`text-sm font-bold ${isLocked ? 'text-muted-foreground' : 'text-blue-900 dark:text-blue-100'}`}>
                                {title}
                            </span>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isLocked ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'}`}>
                            {isLocked ? "Đã hết lượt nghe" : `Còn lại: ${remainingPlays} lượt`}
                        </span>
                    </div>

                    {/* Thanh tiến trình */}
                    <div className="relative w-full h-2.5 bg-border/50 rounded-full overflow-hidden">
                        <div 
                            className={`absolute top-0 left-0 h-full transition-all duration-100 rounded-full ${isLocked ? 'bg-muted-foreground' : 'bg-blue-500'}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-muted-foreground tabular-nums">
                            {formatTime(currentTime)}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            {isLocked ? <AlertCircle className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5" />}
                            <span className="tabular-nums">{formatTime(duration)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
