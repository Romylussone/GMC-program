import { readFile, mkdir, writeFile, stat } from 'node:fs/promises';

const source = await readFile(new URL('../shared/catalog.js', import.meta.url), 'utf8');
const ids = [...new Set([...source.matchAll(/photo\('(photo-[^']+)'/g)].map((match) => match[1]))];
await mkdir(new URL('../public/images/', import.meta.url), { recursive: true });
await Promise.all(
  ids.map(async (id) => {
    const target = new URL(`../public/images/${id}.jpg`, import.meta.url);
    if (await stat(target).catch(() => null)) {
      console.log(`${id}: déjà présent`);
      return;
    }
    const response = await fetch(
      `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=85`,
      { signal: AbortSignal.timeout(45000) },
    );
    if (!response.ok) throw new Error(`${id}: HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    await writeFile(target, bytes);
    console.log(`${id}: ${Math.round(bytes.length / 1024)} Ko`);
  }),
);
