function validateScore(score) {
  if (typeof score !== 'number' || !Number.isFinite(score)) {
    throw new TypeError('Scores must be finite numbers.');
  }
  if (score < 0 || score > 100) {
    throw new RangeError('Scores must be between 0 and 100.');
  }
}

export function averageScore(scores) {
  if (!Array.isArray(scores) || scores.length === 0) {
    throw new TypeError('Provide a non-empty array of scores.');
  }
  // Array.from also exposes missing entries in sparse arrays for validation.
  const values = Array.from(scores);
  values.forEach(validateScore);
  return values.reduce((total, score) => total + score, 0) / values.length;
}

export function letterGrade(score) {
  validateScore(score);
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export function summarizeStudent(student) {
  if (
    student === null ||
    typeof student !== 'object' ||
    typeof student.name !== 'string' ||
    student.name.trim() === ''
  ) {
    throw new TypeError('Each student needs a non-empty name.');
  }
  const average = averageScore(student.scores);
  return {
    name: student.name.trim(),
    average,
    grade: letterGrade(average),
    passed: average >= 60,
  };
}

export function summarizeClass(students) {
  if (!Array.isArray(students) || students.length === 0) {
    throw new TypeError('Provide a non-empty array of students.');
  }
  const summaries = Array.from(students, summarizeStudent);
  return {
    students: summaries,
    classAverage: averageScore(summaries.map((student) => student.average)),
    passedCount: summaries.filter((student) => student.passed).length,
    studentCount: summaries.length,
  };
}
