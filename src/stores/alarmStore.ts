import { create } from 'zustand';
import type { Alarm } from '../features/alarms/alarmTypes';
import { saveAlarm } from '../services/indexedDb';

const initialAlarms: Alarm[] = [
  {
    id: 'design-update',
    severity: 'INFO',
    title: 'Design synchronized',
    description: 'Pit A design 2026.07.22-R03 is active.',
    timestamp: new Date(Date.now() - 18 * 60_000).toISOString(),
    acknowledged: true,
  },
  {
    id: 'correction-brief',
    severity: 'WARNING',
    title: 'Correction latency event',
    description: 'NTRIP correction age exceeded 2.0 s for 4 seconds.',
    timestamp: new Date(Date.now() - 7 * 60_000).toISOString(),
    acknowledged: false,
  },
];

type AlarmState = {
  alarms: Alarm[];
  trigger: (alarm: Omit<Alarm, 'timestamp' | 'acknowledged'>) => void;
  acknowledge: (id: string) => void;
  acknowledgeAll: () => void;
};

export const useAlarmStore = create<AlarmState>((set) => ({
  alarms: initialAlarms,
  trigger: (alarm) => {
    const value = { ...alarm, timestamp: new Date().toISOString(), acknowledged: false };
    set((state) => ({ alarms: [value, ...state.alarms.filter((item) => item.id !== value.id)] }));
    void saveAlarm(value);
  },
  acknowledge: (id) =>
    set((state) => ({
      alarms: state.alarms.map((alarm) =>
        alarm.id === id ? { ...alarm, acknowledged: true } : alarm,
      ),
    })),
  acknowledgeAll: () =>
    set((state) => ({ alarms: state.alarms.map((alarm) => ({ ...alarm, acknowledged: true })) })),
}));
