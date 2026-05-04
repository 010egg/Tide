import { create } from 'zustand';

interface DocumentState {
  content: string;
  cursorLine: number;
  cursorColumn: number;
  isComposing: boolean;
  isSourceMode: boolean;

  setContent: (content: string) => void;
  setCursor: (line: number, column: number) => void;
  setComposing: (v: boolean) => void;
  toggleSourceMode: () => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  content: '',
  cursorLine: 1,
  cursorColumn: 1,
  isComposing: false,
  isSourceMode: false,

  setContent: (content) => set({ content }),

  setCursor: (line, column) => set({ cursorLine: line, cursorColumn: column }),

  setComposing: (v) => set({ isComposing: v }),

  toggleSourceMode: () => set((s) => ({ isSourceMode: !s.isSourceMode })),
}));
