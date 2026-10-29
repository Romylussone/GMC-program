# Measured benchmark results

2026-10-29T11:39:53.210Z

| Framework | Render 100 | Render 500 | Render 1,000 | Update 50 | Delete 50 | Heap delta, 1,000 |
|---|---:|---:|---:|---:|---:|---:|
| react | 20.55 ms | 69.20 ms | 141.90 ms | 21.05 ms | 13.40 ms | 1.50 MiB |
| angular | 19.15 ms | 88.00 ms | 179.90 ms | 15.65 ms | 334.25 ms | 10.37 MiB |
| vue | 19.75 ms | 61.15 ms | 119.80 ms | 13.20 ms | 8.45 ms | 2.30 MiB |
| svelte | 23.20 ms | 57.90 ms | 132.25 ms | 18.80 ms | 8.75 ms | 3.48 MiB |

Median of 10 samples after 3 warm-ups per case. Updates and deletions begin with 1,000 tasks. Time includes framework commit and forced layout; excludes startup, paint and fixture construction.

Browser: 156.0.8078.49, headless. OS: win32 10.0.22631. CPU: 13th Gen Intel(R) Core(TM) i5-1335U. RAM: 23.6 GiB. Viewport: 1,100 × 650. Order: vue, svelte, angular, react (seed 20261029). No CPU throttling.

Memory is a single post-GC JavaScript heap delta between an empty app and 1,000 rows, collected after timings with CDP; it excludes most native DOM and process memory. It is not a repeated statistical estimate.

Angular uses production-mode JIT, compiled before timing, explicit change detection and ngModel. Other apps use production bundles and their documented commit APIs. These are equivalent user-facing workloads, not identical framework internals or a universal ranking. Re-run locally and inspect the raw samples in benchmark.json before drawing conclusions.
