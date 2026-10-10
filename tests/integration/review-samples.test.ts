import { expect, test } from 'vitest';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { PDFDocument } from 'pdf-lib';
import { decodeBackup } from '../../src/transfer/backup';

test('PERF-01/04 review samples contain the full S/P fixtures and mixed eight-page PDF', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'review-samples-'));
  try {
    const generate = () => execFileSync(process.execPath, ['--experimental-strip-types', 'scripts/build-review-samples.mjs', dir]);
    generate();
    expect((await readdir(dir)).sort()).toEqual(['P.pdf', 'R4.pdf', 'S.snote', 'index.html', 'manifest.json']);
    const note = await decodeBackup(await readFile(join(dir, 'S.snote'), 'utf8'));
    expect(note.pages).toHaveLength(1);
    expect(note.pages[0].elements.filter(element => element.type === 'stroke')).toHaveLength(2000);
    expect(note.pages[0].elements.filter(element => element.type === 'shape')).toHaveLength(100);
    expect(note.pages[0].elements.reduce((n, element) => n + (element.type === 'stroke' ? element.points.length : 0), 0)).toBe(200000);
    const performance = await readFile(join(dir, 'P.pdf'));
    expect(performance.length).toBeLessThanOrEqual(5 * 1024 * 1024);
    expect((await PDFDocument.load(performance)).getPageCount()).toBe(20);
    const rotation = await PDFDocument.load(await readFile(join(dir, 'R4.pdf')));
    expect(rotation.getPageCount()).toBe(8);
    expect(rotation.getPages().map(page => page.getRotation().angle)).toEqual([0, 90, 180, 270, 0, 90, 180, 270]);
    expect(rotation.getPages()[0].getWidth()).toBeCloseTo(595.28, 2);
    expect(rotation.getPages()[1].getWidth()).toBeCloseTo(841.89, 2);
    expect(rotation.getPages()[4].getCropBox().x).toBeGreaterThan(0);
    const first = await readFile(join(dir, 'manifest.json'), 'utf8');
    generate();
    expect(await readFile(join(dir, 'manifest.json'), 'utf8')).toBe(first);
  } finally { await rm(dir, { recursive: true, force: true }); }
}, 30000);
