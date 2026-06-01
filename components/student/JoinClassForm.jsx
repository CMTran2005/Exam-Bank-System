"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { studentService } from "@/services/studentService";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function JoinClassForm({ onJoinSuccess }) {
    const { currentUser } = useAuth();
    const [codeValues, setCodeValues] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef([]);
    const [joining, setJoining] = useState(false);
    
    const joinCode = codeValues.join("");

    const handleJoinClass = async (e) => {
        e.preventDefault();
        if (joinCode.length < 6) {
            toast.error("Vui lòng nhập đủ 6 ký tự mã lớp");
            return;
        }
        
        const code = joinCode.trim().toUpperCase();

        setJoining(true);
        try {
            const result = await studentService.joinClassByCode(currentUser.uid, currentUser.name, code);
            if (result.success) {
                toast.success(`Tham gia lớp "${result.classData.name}" thành công!`);
                setCodeValues(["", "", "", "", "", ""]);
                if (onJoinSuccess) onJoinSuccess();
            }
        } catch (error) {
            toast.error(error.message || "Có lỗi xảy ra khi tham gia lớp.");
        } finally {
            setJoining(false);
        }
    };

    const handleCodeChange = (index, value) => {
        const val = value.slice(-1).toUpperCase();
        const newVals = [...codeValues];
        newVals[index] = val;
        setCodeValues(newVals);
        
        if (val && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !codeValues[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").trim().toUpperCase();
        if (!pastedData) return;
        
        // Chỉ lấy tối đa 6 ký tự chữ/số
        const cleanData = pastedData.replace(/[^A-Z0-9]/g, '').slice(0, 6);
        if (!cleanData) return;
        
        const newVals = [...codeValues];
        for (let i = 0; i < cleanData.length; i++) {
            newVals[i] = cleanData[i];
        }
        setCodeValues(newVals);
        
        // Focus vào ô tiếp theo hoặc ô cuối cùng nếu đã đủ
        const nextIndex = Math.min(cleanData.length, 5);
        inputRefs.current[nextIndex]?.focus();
    };

    return (
        <form onSubmit={handleJoinClass} className="w-full lg:w-auto bg-muted/30 p-2 sm:p-3 rounded-2xl border border-border flex flex-col sm:flex-row items-center gap-3 mt-4 md:mt-0 transition-colors hover:bg-muted/50">
            <div className="flex gap-1.5 sm:gap-2">
                {codeValues.map((v, i) => (
                    <Input 
                        key={i}
                        ref={el => inputRefs.current[i] = el}
                        value={v}
                        onChange={(e) => handleCodeChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        onPaste={handlePaste}
                        className="w-10 h-11 sm:w-12 sm:h-12 text-center text-lg sm:text-xl font-black rounded-xl bg-background border-border shadow-sm focus-visible:ring-primary focus-visible:ring-offset-1 uppercase transition-all"
                        maxLength={1}
                        disabled={joining}
                        placeholder="-"
                    />
                ))}
            </div>
            <Button
                type="submit"
                disabled={joining || joinCode.length < 6}
                className="w-full sm:w-auto h-11 sm:h-12 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90 transition-all text-sm shadow-sm shrink-0"
            >
                {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : "Tham Gia"}
            </Button>
        </form>
    );
}
