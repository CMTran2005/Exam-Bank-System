import { create } from 'zustand';

export const useExamDataStore = create((set) => ({
    examInfo: {
        title: "", code: "", year: "", grade: "", subject: "", province: "", duration: "", isPublic: false
    },
    setExamInfo: (info) => set((state) => ({ 
        examInfo: typeof info === 'function' ? info(state.examInfo) : info 
    })),
    
    questionsList: [],
    setQuestionsList: (list) => set((state) => ({
        questionsList: typeof list === 'function' ? list(state.questionsList) : list
    })),
    
    activeUsers: [],
    setActiveUsers: (users) => set({ activeUsers: typeof users === 'function' ? users(useExamDataStore.getState().activeUsers) : users }),
    
    lastSaved: null,
    setLastSaved: (time) => set({ lastSaved: time })
}));
