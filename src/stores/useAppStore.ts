import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface SimpleAppStore {
  // UI state
  theme: 'light' | 'dark';
  showAdvancedOptions: boolean;
  
  // Actions
  updateUIState: (updates: Partial<Pick<SimpleAppStore, 'theme' | 'showAdvancedOptions'>>) => void;
  resetApp: () => void;
}

const initialState = {
  theme: 'light' as const,
  showAdvancedOptions: false,
};

export const useAppStore = create<SimpleAppStore>()(
  devtools(
    (set) => ({
      // State
      ...initialState,

      // Actions
      updateUIState: (updates) => {
        set((state) => ({ ...state, ...updates }), false, 'updateUIState');
      },

      resetApp: () => {
        set(initialState, false, 'resetApp');
      },
    }),
    {
      name: 'glyph-potluck-app-store',
    }
  )
);
