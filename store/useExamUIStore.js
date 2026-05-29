import { create } from 'zustand';

export const useExamUIStore = create((set) => ({
    showPicker: false,
    setShowPicker: (show) => set({ showPicker: show }),
    
    zenMode: false,
    toggleZenMode: () => set((state) => {
        const newZen = !state.zenMode;
        window.dispatchEvent(new CustomEvent("toggle-zen-mode", { detail: newZen }));
        return { zenMode: newZen };
    }),
    
    showAIAssistant: false,
    setShowAIAssistant: (show) => set({ showAIAssistant: typeof show === 'function' ? show(useExamUIStore.getState().showAIAssistant) : show }),
    
    aiPromptText: "",
    setAiPromptText: (text) => set({ aiPromptText: text }),
    
    aiGenType: "multiple_choice",
    setAiGenType: (type) => set({ aiGenType: type }),
}));
