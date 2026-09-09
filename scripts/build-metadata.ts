import { readFileSync } from 'node:fs';
export function buildMetadata() {
  try {
    const worker = readFileSync('dist/sw.js', 'utf8');
    const info = JSON.parse(readFileSync('dist/build-info.json', 'utf8')) as { commit: string | null };
    return { build: info.commit ?? 'local', pwaVersion: worker.match(/const VERSION = "([^"]+)"/)?.[1] ?? null };
  } catch { return { build: null, pwaVersion: null }; }
}
