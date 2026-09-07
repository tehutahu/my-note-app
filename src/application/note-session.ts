import type { NoteSnapshot } from '../domain/notebook';
export type SaveStatus = 'saved' | 'saving' | 'failed';
export class NoteSession {
  status: SaveStatus = 'saved';
  error: unknown = null;
  private revision: number;
  private dirty = false;
  private running: Promise<void> | undefined;
  constructor(public snapshot: NoteSnapshot, private writer: (snapshot: NoteSnapshot, revision: number) => Promise<void>, private changed: () => void = () => {}) {
    this.revision = snapshot.notebook.revision;
  }
  edit(next: NoteSnapshot): void {
    this.snapshot = structuredClone(next); this.dirty = true;
    if (this.status !== 'failed') this.start();
    this.changed();
  }
  async flush(): Promise<void> { await this.running; }
  retry(): void {
    if (this.status !== 'failed') return;
    this.error = null; this.status = 'saving'; this.start();
  }
  private start(): void {
    if (this.running) return;
    this.status = 'saving';
    this.running = this.save().finally(() => { this.running = undefined; });
  }
  private async save(): Promise<void> {
    while (this.dirty) {
      this.dirty = false;
      const snapshot = structuredClone(this.snapshot);
      snapshot.notebook.revision = this.revision + 1;
      snapshot.notebook.updatedAt = new Date().toISOString();
      try {
        await this.writer(snapshot, this.revision);
        this.revision++;
        if (!this.dirty) this.snapshot = snapshot;
      } catch (error) {
        this.dirty = true; this.error = error; this.status = 'failed'; this.changed(); return;
      }
    }
    this.status = 'saved'; this.changed();
  }
}
