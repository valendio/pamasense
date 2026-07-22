import type { OperationalLog } from './operationalLog';

function download(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportLogsJson(logs: OperationalLog[]) {
  download(JSON.stringify(logs, null, 2), 'pamasense-operational-log.json', 'application/json');
}

export function exportLogsCsv(logs: OperationalLog[]) {
  const headers: (keyof OperationalLog)[] = [
    'timestamp',
    'machineId',
    'bucketEast',
    'bucketNorth',
    'bucketElevation',
    'designElevation',
    'verticalOffset',
    'guidanceStatus',
    'gnssSolution',
    'verticalAccuracyM',
    'boomAngleDeg',
    'armAngleDeg',
    'bucketAngleDeg',
  ];
  const rows = logs.map((log) => headers.map((header) => String(log[header] ?? '')).join(','));
  download([headers.join(','), ...rows].join('\n'), 'pamasense-operational-log.csv', 'text/csv');
}
