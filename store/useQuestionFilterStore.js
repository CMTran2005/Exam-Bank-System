import { create } from 'zustand';

export const useQuestionFilterStore = create((set) => ({
    searchTerm: "",
    setSearchTerm: (term) => set({ searchTerm: term }),
    
    tagSearch: "all",
    setTagSearch: (tag) => set({ tagSearch: tag }),
    
    examTitleSearch: "all",
    setExamTitleSearch: (title) => set({ examTitleSearch: title }),
    
    selectedGrade: "all",
    setSelectedGrade: (grade) => set({ selectedGrade: grade }),
    
    selectedSubject: "all",
    setSelectedSubject: (subject) => set({ selectedSubject: subject }),
    
    selectedType: "all",
    setSelectedType: (type) => set({ selectedType: type }),
    
    selectedProvince: "all",
    setSelectedProvince: (province) => set({ selectedProvince: province }),
    
    selectedDifficulty: "all",
    setSelectedDifficulty: (diff) => set({ selectedDifficulty: diff }),
    
    resetFilters: () => set({
        searchTerm: "",
        tagSearch: "all",
        examTitleSearch: "all",
        selectedGrade: "all",
        selectedSubject: "all",
        selectedType: "all",
        selectedProvince: "all",
        selectedDifficulty: "all",
    })
}));
