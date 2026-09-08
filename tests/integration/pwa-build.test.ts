import { test, expect } from 'vitest';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

test('PWA-03 worker-only updates have independent caches and reproducible versions', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'note-pwa-'));
  try {
    await mkdir(join(dir, 'dist'));
    await writeFile(join(dir, 'dist/index.html'), '<title>fixture</title>');
    const source = await readFile('scripts/build-pwa.mjs', 'utf8');
    const script = join(dir, 'build-pwa.mjs');
    const build = async (code: string) => {
      await writeFile(script, code);
      execFileSync(process.execPath, [script], { cwd: dir, env: { ...process.env, BUILD_COMMIT: 'b946599' + 'a'.repeat(33) } });
      return await readFile(join(dir, 'dist/sw.js'), 'utf8');
    };
    const first = await build(source);
    expect(first).toContain('commit: "b946599"');
    expect(await build(source)).toBe(first);
    const changed = await build(source.replace('let updating = false;', 'let updating = false; /* worker update fixture */'));
    expect(changed.match(/const VERSION = "([^"]+)"/)?.[1]).not.toBe(first.match(/const VERSION = "([^"]+)"/)?.[1]);
    expect(await build(source)).toBe(first);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
