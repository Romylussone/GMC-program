# DOM Bench · Framework Performance Lab

A reproducible comparison of React, Angular, Vue, and Svelte, with four working to-do applications and a shared performance dashboard.

## Run locally

Requires Node.js **20.19+** (or a supported newer LTS) and npm.

```bash
npm ci
npm run build
npm start
```

Open **http://127.0.0.1:4173**. The dashboard includes an overview chart, an editable task playground, detailed results, CSV export, methodology, and the reflection report. It loads the recorded measurements by default. **Run benchmarks** replaces them with measurements from your browser; those results are stored locally. Task edits last until the app reloads or you switch frameworks.

The standalone apps are available at `/react.html`, `/angular.html`, `/vue.html`, and `/svelte.html`.

## Deliverables

| Deliverable | Location |
|---|---|
| React components and state | [src/react/main.jsx](src/react/main.jsx) |
| Angular directives and two-way binding | [src/angular/main.ts](src/angular/main.ts) |
| Vue reactive state and directives | [src/vue/App.vue](src/vue/App.vue) |
| Svelte compiled, keyed updates | [src/svelte/App.svelte](src/svelte/App.svelte) |
| Measured comparison table and environment | [results/RESULTS.md](results/RESULTS.md) |
| Raw timing samples and heap measurements | [results/benchmark.json](results/benchmark.json) |
| 200–300 word reflection report | [REFLECTION.md](REFLECTION.md) |

Each app supports adding a task with a name and priority, viewing all tasks, editing either field directly, and deleting any task. Blank names cannot be added. Every row has a stable ID; none of the implementations virtualizes the list.

## Reproduce the measurements

```bash
npm run build
npm test
npm run benchmark
```

The scripts use locally installed Chrome or Edge when present. Otherwise install the browser once:

```bash
npx playwright install chromium
```

The test and benchmark scripts start and stop their own static server if one is not already running. `npm run benchmark` writes the Markdown table, raw JSON, public dashboard data, and reflection report. Rebuild after benchmarking to copy the updated public assets into a fresh distribution. Generated local screenshots live in the ignored `artifacts/` directory.

### Workload and measurement boundary

| Case | Starting state | Measured operation |
|---|---|---|
| Initial render 100 | Empty mounted list | Insert 100 tasks |
| Initial render 500 | Empty mounted list | Insert 500 tasks |
| Initial render 1,000 | Empty mounted list | Insert 1,000 tasks |
| Update 50 | Fresh 1,000-task list | Change the first 50 names and priorities |
| Delete 50 | Fresh 1,000-task list | Remove the first 50 tasks |

Data preparation and baseline restoration happen **outside** the timed region. Each operation uses `performance.now()` around the state change, framework commit, and an `offsetHeight` read that forces layout. The benchmark then verifies row counts, stable IDs, names, and priorities against the expected data. Verification is not timed. The timed initial render is list insertion into an already mounted application; it is not navigation time, framework bootstrap, first contentful paint, or screen paint.

Each case has **3 warm-up runs and 10 measured runs**, summarized by the median. All samples, minimums, and maximums are retained. Each framework has identical data, task-row structure, CSS, and viewport dimensions (1,100 × 650). The browser dashboard uses sequential isolated iframes. The automated harness uses a fresh page for each framework, in a reproducible seeded shuffled order, and records the browser, CPU, OS, memory, and executed order.

The apps use production/minified bundles. React uses `flushSync`, Vue uses `nextTick`, Svelte uses `tick`, and Angular calls `ChangeDetectorRef.detectChanges()`, waits a microtask for `ngModel`, then checks again. Angular 20 runs zoneless in production mode with **JIT templates compiled before timing**. It is deliberately a small standalone esbuild example, not an Angular CLI AOT build. `ngFor`, `ngIf`, and `ngModel` meet the exercise requirements, although newer Angular projects may prefer modern control-flow syntax.

Memory is a **single post-GC JavaScript heap delta** between the warmed empty app and 1,000 task rows, measured after timings through Chrome DevTools Protocol (`HeapProfiler.collectGarbage`, `Runtime.getHeapUsage`). It excludes most native DOM and browser-process allocations; it is not a measure of total memory or a statistical estimate. Memory is unavailable in in-page benchmark runs and shown only for the recorded automated run.

### Interpreting results

These results describe these implementations on one device. Angular's form directives, Vue and Svelte's reactive state, and React's controlled inputs have different internal costs. Differences cannot be attributed solely to a virtual DOM or compilation strategy. Browser scheduling, garbage collection, JIT optimization, operating-system load, run order, and timer precision affect results. Close busy applications, keep the benchmark foregrounded, compare on the same machine, and repeat across browsers before generalizing. No universal framework ranking is claimed.

The browser runner can overwrite the displayed dataset; CSV exports identify its source and timestamp. The recorded data remains in `results/benchmark.json` regardless of browser-local results. Clear this site's local storage to restore the recorded dashboard dataset.

## Validation

`npm run verify` rebuilds the applications, checks all recorded statistics and delivery files, then runs the browser tests. It verifies that the comparison table matches the raw samples, the saved framework versions match the installed dependencies, the dashboard data matches the report, and the reflection contains 200–300 words.

`npm test` checks real browser interactions in all four frameworks: add, name and priority editing, delete, blank-name rejection, 1,000-row rendering, all five benchmark operations with DOM assertions, and empty state. It also checks dashboard navigation, framework switching, sample loading, clearing, the methodology dialog, and mobile horizontal overflow. `npm run benchmark` verifies the resulting DOM on every warm-up and measured sample.

## Source references

- [React: flushSync](https://react.dev/reference/react-dom/flushSync)
- [Angular: zoneless change detection](https://angular.dev/guide/zoneless)
- [Angular: ChangeDetectorRef](https://angular.dev/api/core/ChangeDetectorRef)
- [Vue: nextTick](https://vuejs.org/api/general.html#nexttick)
- [Svelte: tick](https://svelte.dev/docs/svelte/svelte#tick)
- [Chrome DevTools Protocol: Runtime.getHeapUsage](https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#method-getHeapUsage)

## GitHub submission

The parent repository is [Romylussone/GMC-program](https://github.com/Romylussone/GMC-program). After committing and pushing these files, the checkpoint URL on its current branch is:

https://github.com/Romylussone/GMC-program/tree/master/checkpoints/dom-bench-framework-js

The implementation is prepared locally; creating files does not publish them to GitHub.
