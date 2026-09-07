export interface Sample { id: number; kind: string; x: number; y: number }
export interface Camera { x: number; y: number; zoom: number }
export class Gestures {
  camera: Camera = { x: 0, y: 0, zoom: 1 };
  owner: number | null = null;
  mode: 'idle' | 'drawing' | 'panning' | 'pinching' = 'idle';
  private contacts = new Map<number, Sample>();
  down(p: Sample, fingerInk: boolean, pan: boolean): 'draw' | 'cancel' | 'ignore' {
    if (this.owner !== null && this.contacts.get(this.owner)?.kind === 'pen') return 'ignore';
    if (p.kind === 'pen') this.cancel();
    if (this.contacts.has(p.id)) return 'ignore';
    this.contacts.set(p.id, p);
    if (this.contacts.size > 1) {
      const wasDrawing = this.mode === 'drawing';
      this.owner = null; this.mode = 'pinching';
      return wasDrawing ? 'cancel' : 'ignore';
    }
    this.owner = p.id;
    this.mode = pan || (p.kind === 'touch' && !fingerInk) ? 'panning' : 'drawing';
    return this.mode === 'drawing' ? 'draw' : 'ignore';
  }
  move(p: Sample): void {
    const previous = this.contacts.get(p.id);
    if (!previous) return;
    const before = [...this.contacts.values()];
    this.contacts.set(p.id, p);
    if (this.mode === 'panning') {
      this.camera.x += p.x - previous.x; this.camera.y += p.y - previous.y;
    } else if (this.mode === 'pinching') {
      const after = [...this.contacts.values()];
      const center = (points: Sample[]) => ({ x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 });
      const distance = (points: Sample[]) => Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      const oldCenter = center(before), newCenter = center(after);
      const oldDistance = distance(before);
      const zoom = Math.max(.25, Math.min(4, this.camera.zoom * (oldDistance ? distance(after) / oldDistance : 1)));
      const factor = zoom / this.camera.zoom;
      this.camera = { x: newCenter.x - (oldCenter.x - this.camera.x) * factor, y: newCenter.y - (oldCenter.y - this.camera.y) * factor, zoom };
    }
  }
  up(id: number): void {
    if (!this.contacts.delete(id)) return;
    if (this.contacts.size === 0) { this.cancel(); return; }
    if (this.contacts.size === 1) {
      this.owner = [...this.contacts.keys()][0]; this.mode = 'panning';
    }
  }
  cancel(): void { this.contacts.clear(); this.owner = null; this.mode = 'idle'; }
}
