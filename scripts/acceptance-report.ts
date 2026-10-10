export interface Evidence { path: string; sha256: string; report: unknown }
interface TestEvidence { title: string; file: string; status: string; project: string; report: string; build: string | null; ids: string[] }
function object(value: unknown): Record<string, unknown> { return value !== null && typeof value === 'object' ? value as Record<string, unknown> : {}; }
function array(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
function text(value: unknown): string { return typeof value === 'string' ? value : ''; }
function ids(title: string): string[] {
  const found = new Set<string>();
  for (const match of title.matchAll(/\b(ENV|INK|NOTE|DATA|XFER|PDF|PWA|UI|PERF)-(\d{2}(?:\/\d{2})*)/g)) {
    for (const number of match[2].split('/')) found.add(`${match[1]}-${number}`);
  }
  return [...found];
}
// Reports are execution evidence, not a declaration that every clause of an ID is met.
export function acceptanceReport(requirements: string, evidence: Evidence[]) {
  const modes = new Map<string, Set<string>>();
  for (const match of requirements.matchAll(/(?:\|\s*|-\s+)((?:ENV|INK|NOTE|DATA|XFER|PDF|PWA|UI|PERF)-\d{2})\s+(A\/H|A|H)(?=\s|：|:)/g)) {
    const entry = modes.get(match[1]) ?? new Set<string>();
    match[2].split('/').forEach(mode => entry.add(mode)); modes.set(match[1], entry);
  }
  const tests: TestEvidence[] = [], issues: string[] = [];
  const reports = evidence.map(source => {
    const data = object(source.report), start = tests.length;
    const metadata = object(object(data.config).metadata), build = text(metadata.build) || null;
    const add = (title: string, file: string, status: string, project: string) => {
      const mapped = ids(title);
      if (/pen-switch\.spec/.test(file)) mapped.push('INK-07');
      tests.push({ title, file, status, project, report: source.path, build, ids: [...new Set(mapped)] });
    };
    if (Array.isArray(data.suites)) {
      if (!build) issues.push(`${source.path}: build identity missing`);
      if (array(data.errors).length) issues.push(`${source.path}: runner errors`);
      if (array(object(data.config).projects).some(project => object(project).retries !== 0)) issues.push(`${source.path}: retries must be zero`);
      const walk = (suites: unknown[]) => {
        for (const rawSuite of suites) {
          const suite = object(rawSuite);
          for (const rawSpec of array(suite.specs)) {
            const spec = object(rawSpec);
            for (const rawTest of array(spec.tests)) {
              const test = object(rawTest), results = array(test.results).map(object);
              const status = results.length === 1 && results[0].status === 'passed' && results[0].retry === 0 && test.status === 'expected'
                ? 'passed' : text(results.at(-1)?.status) === 'passed' ? 'retried-or-unexpected' : text(results.at(-1)?.status) || 'not-run';
              add(text(spec.title), text(spec.file), status, text(test.projectName));
            }
          }
          walk(array(suite.suites));
        }
      };
      walk(data.suites);
    } else if (Array.isArray(data.testResults)) {
      if (data.success !== true) issues.push(`${source.path}: runner unsuccessful`);
      for (const rawSuite of data.testResults) {
        const suite = object(rawSuite);
        for (const rawTest of array(suite.assertionResults)) {
          const test = object(rawTest);
          add(text(test.fullName) || [...array(test.ancestorTitles), test.title].join(' '), text(suite.name), text(test.status) || 'not-run', 'vitest');
        }
      }
    } else issues.push(`${source.path}: unknown or missing report`);
    const count = tests.length - start;
    if (!count) issues.push(`${source.path}: no executed tests`);
    return { path: source.path, sha256: source.sha256, build, metadata, tests: count };
  });
  if (!evidence.length) issues.push('No reports provided');
  const items = [...modes].map(([id, required]) => ({ id, modes: [...required].sort(), tests: tests.filter(test => test.ids.includes(id)),
    automaticAcceptance: required.has('A') ? 'requires-clause-review' : null, humanStatus: required.has('H') ? 'unverified' : null }));
  return { schemaVersion: 1, interpretation: 'Execution evidence only. Unmapped requirements, clause review, environment audits, stability and human verification remain separate.',
    successful: issues.length === 0 && tests.length > 0 && tests.every(test => test.status === 'passed'),
    builds: [...new Set(reports.flatMap(report => report.build ? [report.build] : []))], reports, issues, items,
    unmappedTests: tests.filter(test => test.ids.length === 0), totalTests: tests.length };
}
