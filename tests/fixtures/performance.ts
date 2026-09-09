import type { NoteSnapshot, PageElement } from '../../src/domain/notebook';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { deflateSync } from 'node:zlib';
// Seed 20260909: deterministic coordinates and pressure; no user content.
export function fixtureNote(index: number, pages: number, strokes: number, points: number, shapes = 0): NoteSnapshot {
  const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  const base = index * 1000000, notebookId = id(base + 1);
  const note: NoteSnapshot = { notebook: { id: notebookId, folderId: null, title: `合成ノート ${index}`, pageIds: [], revision: 0,
    createdAt: '2026-09-09T00:00:00.000Z', updatedAt: '2026-09-09T00:00:00.000Z', deletedAt: null }, pages: [] };
  for (let pageIndex = 0; pageIndex < pages; pageIndex++) {
    const pageId = id(base + 2 + pageIndex), elements: PageElement[] = [];
    for (let i = 0; i < strokes; i++) elements.push({ id: id(base + 100 + pageIndex * 10000 + i), type: 'stroke', tool: 'pen', color: '#244f46', widthPt: 3,
      points: Array.from({ length: points }, (_, j) => ({ x: 20 + (i % 20) * 27 + j / points * 20,
        y: 20 + (Math.floor(i / 20) % 35) * 22 + Math.sin(j / 8) * 4, p: .2 + ((i + j + 20260909) % 80) / 100 })) });
    for (let i = 0; i < shapes; i++) elements.push({ id: id(base + 900000 + i), type: 'shape', kind: 'rectangle',
      x1: 20 + (i % 10) * 50, y1: 20 + Math.floor(i / 10) * 60, x2: 50 + (i % 10) * 50, y2: 50 + Math.floor(i / 10) * 60, color: '#334455', widthPt: 2 });
    note.pages.push({ id: pageId, notebookId, widthPt: 595.28, heightPt: 841.89, background: { kind: 'plain', color: '#fffefb' }, elements, revision: 0 });
    note.notebook.pageIds.push(pageId);
  }
  return note;
}
function image(): Buffer {
  const chunk = (name: string, data: Buffer) => {
    const body = Buffer.concat([Buffer.from(name), data]); let crc = 0xffffffff;
    for (const byte of body) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
    const size = Buffer.alloc(4), checksum = Buffer.alloc(4); size.writeUInt32BE(data.length); checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
    return Buffer.concat([size, body, checksum]);
  };
  const header = Buffer.alloc(13); header.writeUInt32BE(256, 0); header.writeUInt32BE(256, 4); header[8] = 8; header[9] = 2;
  const pixels = Buffer.alloc(256 * (256 * 3 + 1));
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const offset = y * 769 + 1 + x * 3; pixels[offset] = x; pixels[offset + 1] = y; pixels[offset + 2] = (x * 7 + y * 13) % 256;
  }
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]);
}
export async function fixturePdf(): Promise<Buffer> {
  const pdf = await PDFDocument.create(), font = await pdf.embedFont(StandardFonts.Helvetica), picture = await pdf.embedPng(image());
  for (let i = 0; i < 20; i++) {
    const page = pdf.addPage([595.28, 841.89]);
    for (let line = 0; line < 20; line++) page.drawText(`Synthetic page ${i + 1} / line ${line + 1} / seed 20260909`, { x: 30, y: 800 - line * 18, size: 12, font });
    page.drawImage(picture, { x: 30, y: 50, width: 256, height: 256 });
  }
  return Buffer.from(await pdf.save());
}
