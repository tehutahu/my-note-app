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

it('PERF save timing includes queued edits and reports a failed commit', async () => {
  const { measurements, startMeasurements } = await import('../../src/diagnostics/runtime');
  let now = 80; const clock = vi.spyOn(performance, 'now').mockImplementation(() => now);
  let commit!: () => void;
  let writes = 0;
  const session = new NoteSession(fixture(), async () => {
    if (++writes === 1) await new Promise<void>(resolve => { commit = resolve; });
    else throw new DOMException('容量不足', 'QuotaExceededError');
  });
  try {
    startMeasurements(); now = 100; session.edit(edited('first'), 90);
    now = 200; session.edit(edited('queued'), 180);
    now = 400; commit(); await session.flush();
    expect(measurements.report()['save-start'].samples.map(sample => sample.durationMs)).toEqual([10, 220]);
    expect(measurements.report()['save-commit'].samples).toEqual([{ durationMs: 310, outcome: 'ok' }, { durationMs: 220, outcome: 'failed' }]);
    expect(session.status).toBe('failed');
  } finally { measurements.stop(); clock.mockRestore(); }
});

it('DATA-02 editor mutations cannot alter the queued save snapshot or its nested values', async () => {
  const next = fixture(); next.pages[0].elements = [
    { id: 'ink', type: 'stroke', tool: 'pen', color: '#123456', widthPt: 3, points: [{ x: 5, y: 7, p: .8 }] },
    { id: 'shape', type: 'shape', kind: 'line', color: '#123456', widthPt: 3, x1: 1, y1: 2, x2: 3, y2: 4 },
  ];
  next.pages[0].pdfSource = { attachmentId: 'pdf', pageIndex: 0, rotation: 90, viewBox: [1, 2, 3, 4] };
  const original = structuredClone(next), writer = vi.fn(async () => {}), session = new NoteSession(fixture(), writer);
  session.edit(next);
  next.notebook.pageIds.push('foreign'); next.pages[0].background.color = '#ffffff';
  const stroke = next.pages[0].elements[0]; if (stroke.type === 'stroke') stroke.points[0].x = 999;
  const shape = next.pages[0].elements[1]; if (shape.type === 'shape') shape.x1 = 999;
  next.pages[0].pdfSource.viewBox[0] = 999;
  await session.flush();
  expect(session.snapshot.pages).toEqual(original.pages);
  expect(session.snapshot.notebook.pageIds).toEqual(original.notebook.pageIds);
});
