import { expect, test } from 'vitest';
import { Measurements } from '../../src/diagnostics/measurements';
test('PERF 計測開始後の生値と中央値/p95/失敗数を保持し、停止後は記録しない', () => {
  const measurements = new Measurements(); measurements.record('input-handler', 100);
  measurements.start();
  for (const value of [20, 5, 15, 10]) measurements.record('input-handler', value);
  measurements.record('input-handler', 1000, 'failed'); measurements.stop(); measurements.record('input-handler', 99);
  expect(measurements.report()['input-handler']).toEqual({ totalCount: 5, totalFailures: 1, count: 5, failures: 1, dropped: 0, medianMs: 12.5, p95Ms: 20,
    samples: [20, 5, 15, 10].map(durationMs => ({ durationMs, outcome: 'ok' })).concat([{ durationMs: 1000, outcome: 'failed' }]) });
});
test('PERF 記録の上限・無効値・再開始・出力snapshotの独立性を保つ', () => {
  const measurements = new Measurements(3); measurements.start();
  for (const value of [NaN, Infinity, -1, 1, 2, 3, 4]) measurements.record('save-commit', value);
  const report = measurements.report();
  expect(report['save-commit']).toMatchObject({ count: 3, dropped: 1, medianMs: 3, p95Ms: 4 });
  report['save-commit'].samples[0].durationMs = 999;
  expect(measurements.report()['save-commit'].samples[0].durationMs).toBe(2);
  measurements.start(); expect(measurements.report()['save-commit']).toMatchObject({ count: 0, dropped: 0, medianMs: null, p95Ms: null });
});
test('PERF retains lifetime failure counts when raw samples exceed capacity', () => {
  const measurements = new Measurements(1); measurements.start();
  measurements.record('save-commit', 20, 'failed');
  expect(measurements.report()['save-commit']).toMatchObject({ medianMs: null, p95Ms: null });
  measurements.record('save-commit', 5);
  expect(measurements.report()['save-commit']).toMatchObject({ totalCount: 2, totalFailures: 1, count: 1, dropped: 1, failures: 0 });
});
