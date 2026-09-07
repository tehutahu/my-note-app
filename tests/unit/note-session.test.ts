import { expect, it, vi } from 'vitest';
import { NoteSession } from '../../src/application/note-session';
import type { NoteSnapshot } from '../../src/domain/notebook';
const fixture = (): NoteSnapshot => ({ notebook: { id: 'n', folderId: null, title: '最初', pageIds: ['p'], revision: 0, createdAt: '', updatedAt: '', deletedAt: null }, pages: [{ id: 'p', notebookId: 'n', widthPt: 595, heightPt: 842, background: { kind: 'plain', color: '#fff' }, elements: [], revision: 0 }] });
const edited = (title: string) => { const note = fixture(); note.notebook.title = title; return note; };
it('DATA-02 commitが終わるまでは保存中を表示する', async () => {
  let commit!: () => void;
  const writer = vi.fn(() => new Promise<void>(resolve => { commit = resolve; }));
  const session = new NoteSession(fixture(), writer);
  session.edit(edited('変更')); expect(session.status).toBe('saving'); expect(writer).toHaveBeenCalledTimes(1);
  commit(); await session.flush(); expect(session.status).toBe('saved');
});
it('DATA-03 遅い保存中の追加編集を直列化し最新の内容を最後に保存する', async () => {
  let commit!: () => void;
  const writes: NoteSnapshot[] = [];
  const writer = vi.fn(async (snapshot: NoteSnapshot) => { writes.push(snapshot); if (writes.length === 1) await new Promise<void>(resolve => { commit = resolve; }); });
  const session = new NoteSession(fixture(), writer);
  session.edit(edited('変更1')); session.edit(edited('変更2')); session.edit(edited('最新'));
  expect(writer).toHaveBeenCalledTimes(1); commit(); await session.flush();
  expect(writes.map(n => [n.notebook.title, n.notebook.revision])).toEqual([['変更1', 1], ['最新', 2]]);
  expect(session.snapshot.notebook.title).toBe('最新'); expect(session.status).toBe('saved');
});
it('DATA-02 失敗後は変更を保持し明示的再試行で回復する', async () => {
  const writer = vi.fn().mockRejectedValueOnce(new DOMException('容量不足', 'QuotaExceededError')).mockResolvedValue(undefined);
  const changed = vi.fn(), session = new NoteSession(fixture(), writer, changed);
  session.edit(edited('保持する')); await session.flush();
  expect(session.status).toBe('failed'); expect(session.snapshot.notebook.title).toBe('保持する');
  session.edit(edited('失敗後の編集')); expect(writer).toHaveBeenCalledTimes(1);
  session.retry(); await session.flush();
  expect(session.status).toBe('saved'); expect(writer.mock.calls[1][0].notebook.title).toBe('失敗後の編集');
  expect(writer.mock.calls[1][1]).toBe(0); expect(changed).toHaveBeenCalled();
});
