# Reflection report

The hardest part of this exercise was defining a fair stopping point for a DOM operation. Measuring only the state assignment misses deferred rendering. I used each framework's commit mechanism and then forced layout, so the clock includes the work needed to make the updated list measurable. Task generation, baseline resets, and DOM verification happen outside the timer. Stable IDs preserve row identity across updates and deletions.

React's component state and reconciliation make list changes straightforward, but an explicit flush is needed for this synchronous measurement boundary. Vue combines reactive state with nextTick, while Svelte's compiled updates use tick to signal completion. Angular uses ngFor, ngIf, ngModel, and explicit change detection. Its form controls perform additional bookkeeping, and its templates are JIT-compiled before measurement. That implementation choice limits comparisons with optimized AOT Angular applications.

On this machine, angular had the lowest median for rendering 100 tasks, svelte for 500, and vue for 1,000. For operations starting with 1,000 tasks, vue was fastest at updating 50 rows and vue at deleting 50. These outcomes are consistent with differences in reconciliation, reactive bookkeeping, and DOM scheduling, but this experiment cannot isolate those causes.

Three warm-ups and ten measured samples reduce startup noise without eliminating garbage collection or operating-system interference. Memory deltas describe JavaScript heap growth rather than total browser memory. I would repeat the experiment across browsers and devices, rotate the framework order, and compare AOT Angular and alternative state patterns before choosing a framework on performance alone.
