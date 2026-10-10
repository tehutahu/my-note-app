import { expect, test } from 'vitest';
import { acceptanceReport } from '../../scripts/acceptance-report';
const requirements = '| INK-01 A/H | draw | result |\n| INK-04 A/H | undo | result |\n| DATA-04 A | migrate | result |\n| ENV-01 A | fresh | result |\n- INK-07 A: switch\n- INK-07 H: device';
function browser(status = 'passed', retries = 0) {
  return { config: { metadata: { build: 'a'.repeat(40) }, projects: [{ retries }] }, errors: [], suites: [{ title: 'input.spec.ts', specs: [
    { title: 'INK-01/04 input and undo', file: 'input.spec.ts', line: 5, tests: [{ projectName: 'chromium', status: status === 'passed' ? 'expected' : 'unexpected', results: [{ status, retry: 0 }] }] },
  ] }] };
}
test('ENV-03 evidence maps shorthand IDs and retains human and missing verification', () => {
  const result = acceptanceReport(requirements, [{ path: 'browser.json', sha256: 'digest', report: browser() },
    { path: 'unit.json', sha256: 'unit-digest', report: { success: true, testResults: [{ name: 'migration.test.ts', assertionResults: [{ ancestorTitles: ['DATA-04 migration'], title: 'rollback', fullName: 'DATA-04 migration rollback', status: 'passed' }] }] } }]);
  expect(result.successful).toBe(true);
  expect(result.items.find(item => item.id === 'INK-04')?.tests[0]).toMatchObject({ title: 'INK-01/04 input and undo', status: 'passed' });
  expect(result.items.find(item => item.id === 'INK-01')?.humanStatus).toBe('unverified');
  expect(result.items.find(item => item.id === 'ENV-01')?.tests).toEqual([]);
  expect(result.items.find(item => item.id === 'DATA-04')?.tests).toHaveLength(1);
  expect(result.items.find(item => item.id === 'INK-07')?.modes).toEqual(['A', 'H']);
  expect(result.builds).toEqual(['a'.repeat(40)]);
});
test('ENV-03 skipped, retried, failed and malformed reports cannot become successful evidence', () => {
  for (const report of [browser('skipped'), browser('failed'), browser('passed', 1), { suites: [] }, {}, { success: false, testResults: [] }]) {
    expect(acceptanceReport(requirements, [{ path: 'bad.json', sha256: 'digest', report }]).successful).toBe(false);
  }
  expect(acceptanceReport(requirements, []).successful).toBe(false);
});
