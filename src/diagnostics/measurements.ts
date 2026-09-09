export const metrics = ['input-handler', 'note-open', 'save-start', 'save-commit', 'pdf-import', 'pdf-page', 'pdf-export'] as const;
export type Metric = typeof metrics[number];
export interface Sample { durationMs: number; outcome: 'ok' | 'failed' }
export class Measurements {
  active = false;
  private buckets = new Map<Metric, { samples: Sample[]; next: number; seen: number; failed: number }>();
  constructor(readonly capacity = 10000) {
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 10000) throw new RangeError('測定記録の上限は1〜10000件です');
  }
  start(): void { this.buckets.clear(); this.active = true; }
  stop(): void { this.active = false; }
  record(metric: Metric, durationMs: number, outcome: Sample['outcome'] = 'ok'): void {
    if (!this.active || !Number.isFinite(durationMs) || durationMs < 0) return;
    const bucket = this.buckets.get(metric) ?? { samples: [], next: 0, seen: 0, failed: 0 };
    const sample = { durationMs, outcome };
    if (bucket.samples.length < this.capacity) bucket.samples.push(sample);
    else { bucket.samples[bucket.next] = sample; bucket.next = (bucket.next + 1) % this.capacity; }
    bucket.seen++; if (outcome === 'failed') bucket.failed++; this.buckets.set(metric, bucket);
  }
  report(): Record<Metric, { samples: Sample[]; totalCount: number; totalFailures: number; count: number; failures: number; dropped: number; medianMs: number | null; p95Ms: number | null }> {
    return Object.fromEntries(metrics.map(metric => {
      const bucket = this.buckets.get(metric);
      const samples = bucket ? [...bucket.samples.slice(bucket.next), ...bucket.samples.slice(0, bucket.next)].map(sample => ({ ...sample })) : [];
      const values = samples.filter(sample => sample.outcome === 'ok').map(sample => sample.durationMs).sort((a, b) => a - b);
      const n = values.length;
      return [metric, { samples, totalCount: bucket?.seen ?? 0, totalFailures: bucket?.failed ?? 0, count: samples.length, failures: samples.length - n, dropped: (bucket?.seen ?? 0) - samples.length,
        medianMs: n ? (values[Math.floor((n - 1) / 2)] + values[Math.floor(n / 2)]) / 2 : null,
        p95Ms: n ? values[Math.ceil(n * .95) - 1] : null }];
    })) as ReturnType<Measurements['report']>;
  }
}
