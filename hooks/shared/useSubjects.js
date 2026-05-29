"use client";

import useSWR from "swr";
import { subjectService } from "@/services/subjectService";
import { GRADE_SUBJECTS_MAP as DEFAULT_MAP } from "@/lib/constants";

export default function useSubjects() {
    const fetcher = async () => {
        const map = await subjectService.getSubjectsMap();
        if (typeof window !== "undefined") {
            localStorage.setItem("eb_subjects_cache", JSON.stringify(map));
        }
        return map;
    };

    let fallbackData = DEFAULT_MAP;
    if (typeof window !== "undefined") {
        const cached = localStorage.getItem("eb_subjects_cache");
        if (cached) {
            try {
                fallbackData = JSON.parse(cached);
            } catch (err) {
                console.warn("Lỗi parse cache:", err);
            }
        }
    }

    const { data, error, isLoading, mutate } = useSWR("subjectsMap", fetcher, {
        fallbackData,
        revalidateOnFocus: false, // Tránh refetch không cần thiết
    });

    const updateSubjects = async (newMap) => {
        try {
            await subjectService.updateSubjectsMap(newMap);
            if (typeof window !== "undefined") {
                localStorage.setItem("eb_subjects_cache", JSON.stringify(newMap));
            }
            await mutate(newMap, false); // Cập nhật state cục bộ ngay lập tức
            return true;
        } catch (err) {
            throw err;
        }
    };

    return { 
        gradeSubjectsMap: data, 
        loading: isLoading, 
        error: error?.message || null, 
        updateSubjects, 
        refreshSubjects: mutate 
    };
}
