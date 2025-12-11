import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ScanHistoryItem {
  data: string;
  type: string;
  timestamp: string; // ISO string for serialization
}

interface ScanState {
  scanHistory: ScanHistoryItem[];
  addScan: (data: string, type: string) => void;
  clearHistory: () => void;
}

export const useScanStore = create<ScanState>()(
  persist(
    (set) => ({
      scanHistory: [],
      addScan: (data, type) =>
        set((state) => ({
          scanHistory: [
            { data, type, timestamp: new Date().toISOString() },
            ...state.scanHistory.slice(0, 9), // Keep only last 10 scans
          ],
        })),
      clearHistory: () => set({ scanHistory: [] }),
    }),
    {
      name: 'ecm-mrv-scan-history',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
