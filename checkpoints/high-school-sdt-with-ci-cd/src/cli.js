import { readFileSync } from 'node:fs';
import { summarizeClass } from './gradebook.js';

const usage = 'Usage: node src/cli.js <students.json>';
const args = process.argv.slice(2);

if (args.length === 1 && ['--help', '-h'].includes(args[0])) {
  console.log(usage);
} else if (args.length !== 1) {
  console.error(usage);
  process.exitCode = 1;
} else {
  try {
    const input = JSON.parse(readFileSync(args[0], 'utf8'));
    console.log(JSON.stringify(summarizeClass(input.students), null, 2));
  } catch (error) {
    console.error(`Gradebook error: ${error.message}`);
    process.exitCode = 1;
  }
}
