import { expect, test } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { decodeBackup, encodeBackup, type Backup } from '../../src/transfer/backup';
import { createHash } from 'node:crypto';
const MiB = 1024 * 1024;
const id = (n: number) => `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;
function base(): Backup {
  return { format: 'my-note-app', schemaVersion: 1, scope: 'library', exportedAt: '2026-09-08T00:00:00.000Z', folders: [], notebooks: [], pages: [], attachments: [] };
}
async function attachment(size: number, n = 1): Promise<Backup['attachments'][number]> {
  const pdf = await PDFDocument.create(); pdf.addPage([400, 300]).drawText('Boundary fixture');
  pdf.setCreationDate(new Date('2026-09-08T00:00:00Z')); pdf.setModificationDate(new Date('2026-09-08T00:00:00Z'));
  const bytes = Buffer.alloc(size, 32); bytes.set(await pdf.save());
  return { id: id(n), mimeType: 'application/pdf', size, sha256: createHash('sha256').update(bytes).digest('hex'), dataBase64: bytes.toString('base64') };
}
test('XFER-03 PDF attachment at 20MiB is accepted, one byte over is rejected', async () => {
  const backup = base(); backup.attachments = [await attachment(20 * MiB)];
  const result = await decodeBackup(JSON.stringify(backup));
  expect(result.attachments[0].size).toBe(20 * MiB);
  expect(await exportResult(backup)).toBe('accepted');
  expect(createHash('sha256').update(new Uint8Array(await result.attachments[0].blob.arrayBuffer())).digest('hex')).toBe(backup.attachments[0].sha256);
  backup.attachments = [await attachment(20 * MiB + 1)];
  await expect(decodeBackup(JSON.stringify(backup))).rejects.toThrow('PDFは20MiBまで');
});

test('XFER-03 total attachments at 64MiB are accepted, one byte over is rejected', async () => {
  const backup = base();
  const large = await attachment(20 * MiB);
  backup.attachments = [large, { ...large, id: id(2) }, { ...large, id: id(3) }, await attachment(4 * MiB, 4)];
  expect((await decodeBackup(JSON.stringify(backup))).attachments.reduce((sum, item) => sum + item.blob.size, 0)).toBe(64 * MiB);
  expect(await exportResult(backup)).toBe('accepted');
  backup.attachments[3] = await attachment(4 * MiB + 1, 4);
  await expect(decodeBackup(JSON.stringify(backup))).rejects.toThrow('添付合計は64MiBまで');
});

function noteBackup(pageCount: number): Backup {
  const backup = base(), now = backup.exportedAt;
  backup.pages = Array.from({ length: pageCount }, (_, i) => ({ id: id(i + 100), notebookId: id(1), widthPt: 595.28, heightPt: 841.89, revision: 0, background: { kind: 'plain', color: '#ffffff' }, elements: [] }));
  backup.notebooks = [{ id: id(1), folderId: null, title: '境界試験', pageIds: backup.pages.map(page => page.id), revision: 0, createdAt: now, updatedAt: now, deletedAt: null }];
  return backup;
}
test('XFER-03 1000 pages are accepted, 1001 pages are rejected', async () => {
  expect((await decodeBackup(JSON.stringify(noteBackup(1000)))).pages).toHaveLength(1000);
  expect(await exportResult(noteBackup(1000))).toBe('accepted');
  await expect(decodeBackup(JSON.stringify(noteBackup(1001)))).rejects.toThrow('1000ページ');
});
test('XFER-03 two million points are accepted, one more is rejected', async () => {
  const backup = noteBackup(1);
  const points = Array.from({ length: 2000000 }, () => ({ x: 1, y: 2, p: .8 }));
  backup.pages[0].elements = [{ id: id(2), type: 'stroke', tool: 'pen', color: '#123456', widthPt: 3, points }];
  const result = await decodeBackup(JSON.stringify(backup));
  expect(result.pages[0].elements[0].type).toBe('stroke');
  if (result.pages[0].elements[0].type === 'stroke') expect(result.pages[0].elements[0].points).toHaveLength(2000000);
  expect(await exportResult(backup)).toBe('accepted');
  points.push({ x: 1, y: 2, p: .8 });
  await expect(decodeBackup(JSON.stringify(backup))).rejects.toThrow('全体200万点');
});
test('XFER-03 UTF-8 file at 100MiB is accepted, one byte over is rejected', async () => {
  const json = JSON.stringify({ ...base(), fixtureText: '境界'.repeat(1000) });
  const text = json + ' '.repeat(100 * MiB - Buffer.byteLength(json));
  expect(Buffer.byteLength(text)).toBe(100 * MiB);
  expect((await decodeBackup(text)).pages).toEqual([]);
  await expect(decodeBackup(text + ' ')).rejects.toThrow('ファイルは100MiBまで');
});

async function exportResult(backup: Backup): Promise<string> {
  return encodeBackup({ ...backup, attachments: backup.attachments.map(a => ({ ...a, blob: new Blob([Buffer.from(a.dataBase64, 'base64')], { type: a.mimeType }) })) })
    .then(() => 'accepted', error => error.message);
}
test('XFER-02 export rejects page/point/attachment limits that would prevent restoration', async () => {
  expect.soft(await exportResult(noteBackup(1001))).toContain('1000ページ');
  const points = noteBackup(1);
  points.pages[0].elements = [{ id: id(2), type: 'stroke', tool: 'pen', color: '#123456', widthPt: 3,
    points: Array.from({ length: 2000001 }, () => ({ x: 1, y: 2, p: .8 })) }];
  expect.soft(await exportResult(points)).toContain('200万点');
  const tooLarge = base(); tooLarge.attachments = [await attachment(20 * MiB + 1)];
  expect.soft(await exportResult(tooLarge)).toContain('20MiB');
  const total = base(), large = await attachment(20 * MiB);
  total.attachments = [large, { ...large, id: id(2) }, { ...large, id: id(3) }, await attachment(4 * MiB + 1, 4)];
  expect.soft(await exportResult(total)).toContain('64MiB');
});
