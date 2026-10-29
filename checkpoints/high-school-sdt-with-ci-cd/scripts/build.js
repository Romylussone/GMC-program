import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

const source = new URL('../src/', import.meta.url);
const output = new URL('../dist/', import.meta.url);

mkdirSync(output, { recursive: true });
for (const file of readdirSync(source).filter((name) => name.endsWith('.js'))) {
  const input = new URL(file, source);
  execFileSync(process.execPath, ['--check', fileURLToPath(input)], {
    stdio: 'inherit',
  });
  copyFileSync(input, new URL(file, output));
}
console.log('Build complete: validated JavaScript copied to dist/.');
