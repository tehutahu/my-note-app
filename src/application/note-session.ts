import { cloneNote } from './clone-note';
import { beginMeasurement } from '../diagnostics/runtime';
import type { NoteSnapshot } from '../domain/notebook';
export type SaveStatus = 'saved' | 'saving' | 'failed';
export class NoteSession {
  status: SaveStatus = 'saved';
  error: unknown = null;
  private revision: number;
  private dirty = false;
  private editedAt: number | undefined;
  private running: Promise<void> | undefined;
  constructor(public snapshot: NoteSnapshot, private writer: (snapshot: NoteSnapshot, revision: number) => Promise<void>, private changed: () => void = () => {}) {
    this.revision = snapshot.notebook.revision;
  }
  edit(next: NoteSnapshot, startedAt = performance.now()): void {
    this.editedAt ??= startedAt;
    this.snapshot = cloneNote(next); this.dirty = true;
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
      const startedAt = this.editedAt ?? performance.now(); this.editedAt = undefined;
      const start = beginMeasurement('save-start', startedAt), commit = beginMeasurement('save-commit', startedAt);
      const snapshot = { notebook: { ...this.snapshot.notebook }, pages: this.snapshot.pages };
      snapshot.notebook.revision = this.revision + 1;
      snapshot.notebook.updatedAt = new Date().toISOString();
      try {
        start();
        await this.writer(snapshot, this.revision);
        commit();
        this.revision++;
        if (!this.dirty) this.snapshot = snapshot;
      } catch (error) {
        commit('failed');
        this.editedAt = Math.min(startedAt, this.editedAt ?? startedAt);
        this.dirty = true; this.error = error; this.status = 'failed'; this.changed(); return;
      }
    }
    this.status = 'saved'; this.changed();
  }
}
