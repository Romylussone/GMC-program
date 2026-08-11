function generateReport(name, scores) {
  if (!Array.isArray(scores) || scores.length === 0) {
    throw new Error('Scores must be a non-empty array of numbers.');
  }

  if (!scores.every((score) => typeof score === 'number' && Number.isFinite(score))) {
    throw new Error('Every score must be a valid number.');
  }

  const average = scores.reduce((total, score) => total + score, 0) / scores.length;
  const status = average >= 10 ? 'Pass' : 'Fail';

  return `Student: ${name}\nAverage score: ${average.toFixed(2)}\nStatus: ${status}`;
}

module.exports = generateReport;
