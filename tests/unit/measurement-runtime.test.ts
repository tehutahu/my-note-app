import { expect, test, vi } from 'vitest';
import { beginMeasurement, measurements, startMeasurements, measure } from '../../src/diagnostics/runtime';
test('PERF ignores work from before recording and before a restarted recording', async () => {
  let now = 10; const clock = vi.spyOn(performance, 'now').mockImplementation(() => now);
  try {
    const before = beginMeasurement('pdf-page');
    startMeasurements(); now = 20; before();
    const old = beginMeasurement('pdf-page');
    now = 30; startMeasurements(); now = 40; old();
    beginMeasurement('save-commit', 25)();
    expect(measurements.report()['pdf-page'].totalCount).toBe(0);
    expect(measurements.report()['save-commit'].totalCount).toBe(0);
    await expect(measure('pdf-import', async () => { now = 50; throw new Error('expected'); })).rejects.toThrow('expected');
    expect(measurements.report()['pdf-import'].samples).toEqual([{ durationMs: 10, outcome: 'failed' }]);
    const end = beginMeasurement('pdf-page'); measurements.stop(); now = 60; end();
    expect(measurements.report()['pdf-page'].totalCount).toBe(0);
  } finally { measurements.stop(); clock.mockRestore(); }
});
