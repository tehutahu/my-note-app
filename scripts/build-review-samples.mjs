import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { PDFDocument, degrees, rgb } from 'pdf-lib';
import { fixtureNote, fixturePdf } from '../tests/fixtures/performance.ts';
import { encodeBackup } from '../src/transfer/backup.ts';
const output = process.argv[2] || 'dist/samples';
await mkdir(output, { recursive: true });
const date = '2026-09-09T00:00:00.000Z';
const note = fixtureNote(1, 1, 2000, 100, 100);
note.notebook.title = '筆記計測サンプル S';
const backup = JSON.parse(await encodeBackup({ folders: [], notebooks: [note.notebook], pages: note.pages, attachments: [] }, 'notebook'));
backup.exportedAt = date;
const pdf = await PDFDocument.create();
pdf.setCreationDate(new Date(date)); pdf.setModificationDate(new Date(date));
for (const cropped of [false, true]) for (const rotation of [0, 90, 180, 270]) {
  const [width, height] = rotation % 180 ? [841.89, 595.28] : [595.28, 841.89];
  const page = pdf.addPage([width, height]);
  if (cropped) page.setCropBox(40, 50, width - 80, height - 100);
  page.setRotation(degrees(rotation));
  page.drawText(`Review page ${pdf.getPageCount()} / Rotation ${rotation} / Crop ${cropped ? 'yes' : 'no'}`, { x: 80, y: 180, size: 14 });
  page.drawText('Draw a circle around the red marker, then export all pages.', { x: 80, y: 155, size: 12 });
  page.drawCircle({ x: 120, y: 110, size: 8, color: rgb(1, 0, 0) });
}
const files = { 'S.snote': Buffer.from(JSON.stringify(backup)), 'P.pdf': await fixturePdf(), 'R4.pdf': Buffer.from(await pdf.save()),
  'index.html': await readFile(new URL('./review-samples.html', import.meta.url)) };
const manifest = { seed: 20260909, files: {} };
for (const [name, bytes] of Object.entries(files)) {
  await writeFile(join(output, name), bytes);
  manifest.files[name] = { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}
await writeFile(join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('Synthetic review samples: S (2000 strokes / 200000 points), P (20 PDF pages), R4 (8 mixed pages)');
