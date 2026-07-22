import { openDB, type DBSchema } from 'idb';
import type { Alarm } from '../features/alarms/alarmTypes';
import type { TerrainDesign } from '../features/mine-design/designTypes';
import type { OperationalLog } from './operationalLog';

type PendingSync = {
  id?: number;
  type: 'TERRAIN' | 'LOG';
  payload: unknown;
  queuedAt: string;
};

interface PamaSenseDb extends DBSchema {
  designs: {
    key: string;
    value: TerrainDesign;
    indexes: { 'by-imported': string };
  };
  telemetryLogs: {
    key: number;
    value: OperationalLog & { id?: number };
    indexes: { 'by-timestamp': string };
  };
  pendingSync: {
    key: number;
    value: PendingSync;
    indexes: { 'by-queued': string };
  };
  alarmHistory: {
    key: string;
    value: Alarm;
    indexes: { 'by-timestamp': string };
  };
}

let databasePromise: ReturnType<typeof openDB<PamaSenseDb>> | null = null;

function getDatabase() {
  if (typeof indexedDB === 'undefined') return null;
  databasePromise ??= openDB<PamaSenseDb>('pamasense-offline-v1', 1, {
    upgrade(database) {
      const designs = database.createObjectStore('designs', { keyPath: 'id' });
      designs.createIndex('by-imported', 'importedAt');
      const logs = database.createObjectStore('telemetryLogs', {
        keyPath: 'id',
        autoIncrement: true,
      });
      logs.createIndex('by-timestamp', 'timestamp');
      const pending = database.createObjectStore('pendingSync', {
        keyPath: 'id',
        autoIncrement: true,
      });
      pending.createIndex('by-queued', 'queuedAt');
      const alarms = database.createObjectStore('alarmHistory', { keyPath: 'id' });
      alarms.createIndex('by-timestamp', 'timestamp');
    },
  });
  return databasePromise;
}

export async function saveDesign(design: TerrainDesign) {
  const database = getDatabase();
  if (!database) return;
  await (await database).put('designs', design);
}

export async function getLatestDesign() {
  const database = getDatabase();
  if (!database) return null;
  const all = await (await database).getAllFromIndex('designs', 'by-imported');
  return all.at(-1) ?? null;
}

export async function saveOperationalLog(log: OperationalLog) {
  const database = getDatabase();
  if (!database) return;
  await (await database).add('telemetryLogs', log);
}

export async function getOperationalLogs(limit = 2500) {
  const database = getDatabase();
  if (!database) return [];
  const all = await (await database).getAllFromIndex('telemetryLogs', 'by-timestamp');
  return all.slice(-limit);
}

export async function queueSynchronization(item: Omit<PendingSync, 'id' | 'queuedAt'>) {
  const database = getDatabase();
  if (!database) return;
  await (await database).add('pendingSync', { ...item, queuedAt: new Date().toISOString() });
}

export async function getPendingSyncCount() {
  const database = getDatabase();
  if (!database) return 0;
  return (await database).count('pendingSync');
}

export async function clearPendingSynchronizations() {
  const database = getDatabase();
  if (!database) return;
  await (await database).clear('pendingSync');
}

export async function saveAlarm(alarm: Alarm) {
  const database = getDatabase();
  if (!database) return;
  await (await database).put('alarmHistory', alarm);
}
