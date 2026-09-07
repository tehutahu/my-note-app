import { cp, mkdir } from 'node:fs/promises';
await mkdir('dist/pdf', { recursive: true });
for (const directory of ['cmaps', 'standard_fonts', 'wasm']) await cp(`node_modules/pdfjs-dist/${directory}`, `dist/pdf/${directory}`, { recursive: true });
