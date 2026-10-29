import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  averageScore,
  letterGrade,
  summarizeClass,
  summarizeStudent,
} from '../src/gradebook.js';

test('averages whole numbers and decimals without rounding', () => {
  assert.equal(averageScore([70, 80, 90]), 80);
  assert.equal(averageScore([80.5, 81]), 80.75);
  assert.equal(averageScore([0]), 0);
  assert.equal(averageScore([100]), 100);
});

test('rejects empty, missing, and non-array scores', () => {
  for (const input of [[], undefined, null, '80', {}]) {
    assert.throws(() => averageScore(input), /non-empty array/);
  }
});

test('rejects non-numeric and non-finite scores', () => {
  for (const input of ['80', null, undefined, NaN, Infinity, -Infinity, true]) {
    assert.throws(() => averageScore([input]), /finite numbers/);
    assert.throws(() => letterGrade(input), /finite numbers/);
  }
  assert.throws(() => averageScore(new Array(2)), /finite numbers/);
});

test('rejects scores outside the allowed range', () => {
  for (const score of [-1, 100.01]) {
    assert.throws(() => averageScore([score]), /between 0 and 100/);
    assert.throws(() => letterGrade(score), /between 0 and 100/);
  }
});

for (const [score, grade] of [
  [0, 'F'],
  [59.99, 'F'],
  [60, 'D'],
  [69.99, 'D'],
  [70, 'C'],
  [79.99, 'C'],
  [80, 'B'],
  [89.99, 'B'],
  [90, 'A'],
  [100, 'A'],
]) {
  test(`assigns ${grade} to a score of ${score}`, () => {
    assert.equal(letterGrade(score), grade);
  });
}

test('trims names, computes a summary, and leaves the input unchanged', () => {
  const student = Object.freeze({
    name: ' Ada ',
    scores: Object.freeze([90, 80]),
  });
  assert.deepEqual(summarizeStudent(student), {
    name: 'Ada',
    average: 85,
    grade: 'B',
    passed: true,
  });
  assert.equal(student.name, ' Ada ');
});

test('rejects missing or blank student names', () => {
  for (const input of [null, undefined, {}, { name: 4 }, { name: '  ' }]) {
    assert.throws(() => summarizeStudent(input), /non-empty name/);
  }
});

test('passes at 60 and does not round 59.999 into a passing score', () => {
  assert.equal(summarizeStudent({ name: 'A', scores: [60] }).passed, true);
  const summary = summarizeStudent({ name: 'B', scores: [59.999] });
  assert.equal(summary.passed, false);
  assert.equal(summary.grade, 'F');
});

test('weights each student equally in the class average', () => {
  assert.deepEqual(
    summarizeClass([
      { name: 'A', scores: [100, 100, 100] },
      { name: 'B', scores: [0] },
    ]),
    {
      students: [
        { name: 'A', average: 100, grade: 'A', passed: true },
        { name: 'B', average: 0, grade: 'F', passed: false },
      ],
      classAverage: 50,
      passedCount: 1,
      studentCount: 2,
    },
  );
});

test('supports a one-student class', () => {
  const summary = summarizeClass([{ name: 'A', scores: [60] }]);
  assert.equal(summary.classAverage, 60);
  assert.equal(summary.passedCount, 1);
  assert.equal(summary.studentCount, 1);
});

test('rejects empty, malformed, and sparse student lists', () => {
  for (const input of [[], null, undefined, 'students']) {
    assert.throws(() => summarizeClass(input), /non-empty array/);
  }
  assert.throws(() => summarizeClass(new Array(1)), /non-empty name/);
  assert.throws(
    () => summarizeClass([{ name: 'A', scores: [] }]),
    /non-empty array/,
  );
});
