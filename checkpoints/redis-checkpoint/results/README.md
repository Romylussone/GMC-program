# Recorded benchmark results

Measured on **2026-10-19** using the implementation in this checkpoint. These are actual local measurements, with raw samples in [small.json](small.json) and [large.json](large.json).

## Environment and procedure

- Windows 11 host (10.0.22631), Intel Core i5-1335U, 12 logical CPUs, approximately 23.64 GiB host RAM; Node.js v20.20.2 runs on the host.
- Docker Engine 29.8.0; Redis **7.4.11** and MongoDB **8.0.34**, each constrained to **1 CPU and 1 GiB RAM**. MongoDB's WiredTiger cache is configured to 0.25 GiB.
- Redis uses AOF with `appendfsync everysec`; MongoDB uses a standalone server and explicit `w:1,j:true` writes. **These are different durability guarantees.** Import times must be interpreted with those settings.
- Clients connect through Docker's localhost port forwarding, using persistent connections. MongoDB pool maximum: 32. Redis requests can benefit from auto/explicit pipelining.
- Three trials, 240 measured calls per workload/database/concurrency/trial, 30 warmup calls per batch. Database order alternates between trials. Total: **8,640 timed calls per dataset, 17,280 overall**.
- Small: 120 stops, 960 trips, 11,520 stop times. Larger: 480 stops, 3,840 trips, 46,080 stop times. Both are deterministic synthetic feeds with 96 trips per route.
- **144 full-result comparisons per dataset passed**, 288 overall. Each dataset has 36/48 nonempty departure cases, 31/48 nonempty direct-trip cases, and 48/48 nonempty nearby cases. The empty cases deliberately exercise inactive dates and reverse travel.

Each latency/throughput entry below is the **median of three trial statistics**. A median p95 is not a pooled p95 or a confidence interval. All timed operations completed successfully. HTTP is excluded; the planner's calendar retrieval, database I/O, result decoding and itinerary processing are included.

## Query timings

### 11,520 stop times

| Operation | Clients | Redis p95, ms | MongoDB p95, ms | Redis req/s | MongoDB req/s |
| --- | ---: | ---: | ---: | ---: | ---: |
| Departures | 1 | 3.41 | 5.32 | 572 | 325 |
| Direct trip | 1 | 4.49 | 12.20 | 382 | 172 |
| Nearby stops | 1 | 3.92 | 3.34 | 430 | 481 |
| Departures | 8 | 4.35 | 9.29 | 3,651 | 1,413 |
| Direct trip | 8 | 10.32 | 79.90 | 1,496 | 407 |
| Nearby stops | 8 | 5.51 | 20.52 | 2,089 | 984 |

### 46,080 stop times

| Operation | Clients | Redis p95, ms | MongoDB p95, ms | Redis req/s | MongoDB req/s |
| --- | ---: | ---: | ---: | ---: | ---: |
| Departures | 1 | 2.88 | 4.49 | 573 | 365 |
| Direct trip | 1 | 3.48 | 10.36 | 484 | 190 |
| Nearby stops | 1 | 2.90 | 3.55 | 508 | 475 |
| Departures | 8 | 4.52 | 8.05 | 3,186 | 1,668 |
| Direct trip | 8 | 7.09 | 11.48 | 1,741 | 1,082 |
| Nearby stops | 8 | 6.93 | 53.84 | 1,744 | 596 |

For the larger dataset at eight clients, p50/p95/p99 are:

| Operation | Redis p50/p95/p99, ms | MongoDB p50/p95/p99, ms |
| --- | ---: | ---: |
| Departures | 2.28 / 4.52 / 6.95 | 4.75 / 8.05 / 9.41 |
| Direct trip | 4.16 / 7.09 / 22.43 | 8.09 / 11.48 / 12.27 |
| Nearby stops | 4.16 / 6.93 / 8.23 | 7.32 / 53.84 / 58.77 |

Redis led median p95 and throughput for departures and direct trips at both sizes and client counts. Nearby lookup at one client was competitive: MongoDB led on the small dataset, while Redis led on the larger one. Redis had a worse median p99 for the larger direct-trip case despite a better p95, illustrating why several percentiles matter.

## Ingestion and storage

Parsing was measured separately: **134.64 ms** for the small feed and **411.45 ms** for the larger one. Loading includes namespace replacement, writes and index creation. There is **one ingestion measurement per database/size**, not a median or a peak-throughput claim. Rows/s uses stop-time count as the denominator, although loading also writes stops, trips and metadata.

| Dataset | Redis import/index, ms | MongoDB import/index, ms | Redis stop times/s | MongoDB stop times/s |
| --- | ---: | ---: | ---: | ---: |
| 11,520 stop times | 145.33 | 351.79 | 79,265 | 32,747 |
| 46,080 stop times | 504.73 | 985.39 | 91,297 | 46,763 |

| Snapshot after queries | Small | Larger |
| --- | ---: | ---: |
| Redis whole-server used memory, MiB | 5.54 | 17.97 |
| Redis whole-server RSS, MiB | 17.55 | 30.11 |
| MongoDB benchmark logical BSON, MiB | 2.86 | 11.58 |
| MongoDB benchmark allocated data storage, MiB | 0.58 | 2.13 |
| MongoDB benchmark allocated indexes, MiB | 0.41 | 1.34 |
| MongoDB whole-server RSS, MiB | 247 | 278 |

These figures measure **different things**. MongoDB's compressed disk allocation is not its memory usage, and Redis's used memory is not disk footprint. RSS includes server overhead/cache; both servers also contain the small demo and integration datasets. MongoDB database sizes cover only the benchmark namespace and exclude journal/other database files. The larger run follows the smaller run, so allocator/cache history affects RSS. No peak RAM, CPU utilization, Redis AOF disk usage or recovery/failover measurement was taken.

A post-run MongoDB `explain("executionStats")` check for stop S0_0, service WK and 08:00–11:00 used index `stopId_1_serviceId_1_departure_1`: **7 keys examined, 7 documents examined, 7 returned**, with an `IXSCAN` under `FETCH`. Its integer server execution time was 0 ms; that does not mean the client-observed request took no time.

## Interpretation and choice

Redis's departure sorted sets and pipelined trip fetches work well for these predefined read operations. MongoDB required less application-specific indexing machinery and retained flexible indexed documents. This is an implementation comparison: changing the schema, driver, query pipeline or caching policy could change the result.

Four times as many stop times did not cause a consistent fourfold latency increase. Departure selectivity per route is roughly constant, while nearby result sizes change with the number of routes. Some larger-run timings are faster than small-run timings. **That is not evidence that either database gets faster as data grows.** The short runs show substantial trial variation, particularly MongoDB's small-feed direct-trip p95 at eight clients: **83.48, 13.44 and 79.90 ms**. Other applications/containers were running on the host. The benchmark did not isolate their impact or establish the cause of tail spikes.

For **these measured read paths**, I would select Redis. For a **large, complete trip-planning system**, I would select MongoDB as the versioned primary data store and add Redis for hot results, with a dedicated routing engine for transfers. If restricted to one database for that broader system, my initial choice is MongoDB based on data-management flexibility and disk-backed capacity. That choice is an architectural judgment; it does not follow from a Redis latency win alone.

Before committing production resources, repeat with licensed real feeds, realistic origin/destination popularity, transfers, live updates, datasets beyond RAM, concurrent imports, equal durability targets and a controlled machine. Include sustained/open-loop traffic, longer trials, timeouts, CPU/peak memory, replica failover and shard expansion. Neither these standalone runs nor their two small dataset sizes establish horizontal scalability.

## Reproduction details

Commands and benchmark design are in the [main README](../README.md#6-reproduce-the-measurements). npm dependencies are fixed by `package-lock.json`; Compose pins the measured database image digests:

```text
redis:7.4-alpine@sha256:858f009f9709ce576febc734aa78b8f6d624b82571f9ddb6bda4377c833b3499
mongo:8.0@sha256:4a4ab5d4834207389e0d7270fac988e21ffedccecba77991a552f755df229907
```

Feed SHA-256 values include sorted `.txt` filenames and their contents:

```text
small  536d481d91aed41209ff840e13cd44c969534c47098e0ddb547a2ed7a550374b
larger 024af8137109e7e8f0be47e78c13093125b77388771cd709b8b4a6436b31ea42
```
