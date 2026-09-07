export class CanvasCache {
  private entries = new Map<string, HTMLCanvasElement>();
  private used = 0;
  get count(): number { return this.entries.size; }
  get bytes(): number { return this.used; }
  trim(budget: number, count = 3): void {
    while (this.entries.size && (this.used > budget || this.entries.size > count)) {
      const key = this.entries.keys().next().value!, canvas = this.entries.get(key)!;
      this.used -= canvas.width * canvas.height * 4; this.entries.delete(key); canvas.width = canvas.height = 0;
    }
  }
  get(key: string, budget: number): HTMLCanvasElement | undefined {
    this.trim(budget);
    const canvas = this.entries.get(key);
    if (canvas) { this.entries.delete(key); this.entries.set(key, canvas); }
    return canvas;
  }
  put(key: string, canvas: HTMLCanvasElement, budget: number): void {
    const size = canvas.width * canvas.height * 4;
    const existing = this.entries.get(key);
    if (existing) { this.used -= existing.width * existing.height * 4; this.entries.delete(key); if (existing !== canvas) existing.width = existing.height = 0; }
    this.trim(budget - size, 2);
    if (size > budget) { canvas.width = canvas.height = 0; return; }
    this.entries.set(key, canvas); this.used += size;
  }
  clear(): void { this.trim(0, 0); }
}
export function rasterPlan(width: number, height: number, dpr: number) {
  const scale = Math.min(dpr, Math.sqrt(32 * 1024 * 1024 / (12 * width * height)), 8192 / width, 8192 / height);
  return { scale, width: Math.max(1, Math.floor(width * scale)), height: Math.max(1, Math.floor(height * scale)) };
}
