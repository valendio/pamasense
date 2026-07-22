import { create } from 'zustand';
import type { OperationalLog } from '../services/operationalLog';
import { saveOperationalLog } from '../services/indexedDb';

type LogState = {
  logs: OperationalLog[];
  retentionLimit: number;
  append: (log: OperationalLog) => void;
  clear: () => void;
};

export const useLogStore = create<LogState>((set) => ({
  logs: [],
  retentionLimit: 3000,
  append: (log) => {
    set((state) => ({ logs: [...state.logs, log].slice(-state.retentionLimit) }));
    void saveOperationalLog(log);
  },
  clear: () => set({ logs: [] }),
}));
