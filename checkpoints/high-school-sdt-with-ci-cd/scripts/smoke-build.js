import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, URL } from 'node:url';

const output = execFileSync(
  process.execPath,
  [
    fileURLToPath(new URL('../dist/cli.js', import.meta.url)),
    fileURLToPath(new URL('../examples/students.json', import.meta.url)),
  ],
  { encoding: 'utf8' },
);

assert.deepEqual(JSON.parse(output), {
  students: [
    { name: 'Ada', average: 85, grade: 'B', passed: true },
    { name: 'Grace', average: 50, grade: 'F', passed: false },
  ],
  classAverage: 67.5,
  passedCount: 1,
  studentCount: 2,
});
console.log('Built CLI smoke test passed.');
