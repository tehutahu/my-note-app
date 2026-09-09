import { Measurements, type Metric, type Sample } from './measurements';
export const measurements = new Measurements();
let generation = 0, recordingSince = Infinity;
export function startMeasurements(): void { generation++; recordingSince = performance.now(); measurements.start(); }
export function beginMeasurement(metric: Metric, startedAt = performance.now()): (outcome?: Sample['outcome']) => void {
  const enabled = measurements.active && startedAt >= recordingSince, epoch = generation;
  return (outcome = 'ok') => {
    if (enabled && epoch === generation) measurements.record(metric, performance.now() - startedAt, outcome);
  };
}
export async function measure<T>(metric: Metric, action: () => Promise<T>): Promise<T> {
  const end = beginMeasurement(metric);
  try { const value = await action(); end(); return value; }
  catch (error) { end('failed'); throw error; }
}
