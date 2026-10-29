import { build } from 'esbuild';
import { compile } from 'svelte/compiler';
import { parse, compileScript } from '@vue/compiler-sfc';
import { readFile, mkdir, cp, writeFile } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
await cp('public', 'dist', { recursive: true });
const plugins = [{ name: 'framework-components', setup(builder) {
  builder.onLoad({ filter: /\.svelte$/ }, async ({ path }) => ({
    contents: compile(await readFile(path, 'utf8'), { filename: path, generate: 'client', dev: false }).js.code,
    loader: 'js'
  }));
  builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
    const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
    return { contents: compileScript(descriptor, { id: 'todo-app', inlineTemplate: true }).content, loader: 'js' };
  });
}}];
for (const framework of ['react', 'angular', 'vue', 'svelte']) {
  await build({ entryPoints: [`src/${framework}/main.${framework === 'react' ? 'jsx' : framework === 'angular' ? 'ts' : 'js'}`],
    outfile: `dist/${framework}.js`, bundle: true, minify: true, format: 'esm', plugins,
    define: { 'process.env.NODE_ENV': '"production"', __VUE_OPTIONS_API__: 'false', __VUE_PROD_DEVTOOLS__: 'false', __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false' },
    tsconfigRaw: { compilerOptions: { experimentalDecorators: true, useDefineForClassFields: false } } });
  await writeFile(`dist/${framework}.html`, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${framework} task workspace</title><link rel="stylesheet" href="/tasks.css"></head><body><div id="app"></div><script type="module" src="/${framework}.js"></script></body></html>`);
}
console.log('Built dashboard and four isolated production apps.');
