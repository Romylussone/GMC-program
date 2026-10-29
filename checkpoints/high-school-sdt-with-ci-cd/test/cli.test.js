import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, URL } from 'node:url';

const cli = fileURLToPath(new URL('../src/cli.js', import.meta.url));
const fixture = fileURLToPath(
  new URL('../examples/students.json', import.meta.url),
);
const run = (...args) =>
  spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });

test('CLI prints a complete JSON report for valid input', () => {
  const result = run(fixture);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  assert.deepEqual(JSON.parse(result.stdout), {
    students: [
      { name: 'Ada', average: 85, grade: 'B', passed: true },
      { name: 'Grace', average: 50, grade: 'F', passed: false },
    ],
    classAverage: 67.5,
    passedCount: 1,
    studentCount: 2,
  });
});

test('CLI displays help successfully', () => {
  for (const flag of ['--help', '-h']) {
    const result = run(flag);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Usage:/);
  }
});

test('CLI fails with usage information for missing or extra arguments', () => {
  for (const args of [[], [fixture, 'extra']]) {
    const result = run(...args);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Usage:/);
    assert.equal(result.stdout, '');
  }
});

test('CLI fails cleanly when the input file does not exist', () => {
  const result = run(`${fixture}.missing`);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Gradebook error:/);
  assert.equal(result.stdout, '');
});

test('CLI rejects malformed JSON and invalid student data', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'gradebook-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const filename = join(directory, 'input.json');
  for (const contents of [
    '{bad json',
    'null',
    '{}',
    '{"students":[]}',
    '{"students":[{"name":"A","scores":[101]}]}',
  ]) {
    writeFileSync(filename, contents);
    const result = run(filename);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Gradebook error:/);
    assert.equal(result.stdout, '');
  }
});
