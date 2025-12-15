import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  notifications: boolean;
  darkMode: boolean;
  setNotifications: (enabled: boolean) => void;
  setDarkMode: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notifications: true,
      darkMode: false,
      setNotifications: (enabled) => set({ notifications: enabled }),
      setDarkMode: (enabled) => set({ darkMode: enabled }),
    }),
    {
      name: 'ecm-mrv-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);


