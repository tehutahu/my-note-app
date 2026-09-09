import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { acceptanceReport } from './acceptance-report.ts';
const paths = process.argv.slice(2);
if (!paths.length) paths.push('artifacts/unit-results.json', 'artifacts/boundary-results.json', 'artifacts/e2e-results.json', 'artifacts/firefox-results.json', 'artifacts/subpath-results.json');
const evidence = [];
for (const path of paths) {
  try {
    const bytes = await readFile(path);
    evidence.push({ path, sha256: createHash('sha256').update(bytes).digest('hex'), report: JSON.parse(bytes.toString()) });
  } catch { evidence.push({ path, sha256: '', report: null }); }
}
const result = acceptanceReport(await readFile('docs/acceptance.md', 'utf8'), evidence);
await mkdir('artifacts', { recursive: true });
await writeFile('artifacts/acceptance-results.json', JSON.stringify({ generatedAt: new Date().toISOString(), ...result }, null, 2) + '\n');
console.log(`${result.items.length} acceptance IDs, ${result.totalTests} test executions; evidence ${result.successful ? 'successful' : 'incomplete or failed'}`);
for (const issue of result.issues) console.error(issue);
if (!result.successful) process.exitCode = 1;
