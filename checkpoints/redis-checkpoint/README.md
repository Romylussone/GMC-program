# GTFS trip planning: Redis versus MongoDB

This checkpoint includes a working Node.js trip planner, equivalent Redis and MongoDB storage adapters, a deterministic GTFS Schedule feed, tests, and a benchmark of application operations. The comparison below distinguishes measurements from architectural recommendations.

## Run the application

Requirements: Node.js 20 or newer, npm, Docker with Compose.

```powershell
npm ci
npm run db:up
npm run ingest
npm start
```

The checked-in sample has 24 stops, 24 trips and 288 stop times. Regenerate it with `npm run generate`. The API defaults to MongoDB and listens on `http://127.0.0.1:3001`. To use Redis instead:

```powershell
$env:DB = 'redis'
npm start
```

Example requests, usable in a browser, Postman, or PowerShell:

```text
GET http://127.0.0.1:3001/stops/nearby?lon=-4.03&lat=5.32&radius=650
GET http://127.0.0.1:3001/departures?stop=S0_0&date=20261019&time=08:00:00&window=10800
GET http://127.0.0.1:3001/plan?from=S0_0&to=S0_11&date=20261019&time=08:00:00
```

The first direct journey for the last request departs at **10:00:00** and arrives at **10:22:00** on route R0. On Saturday `20261024`, the same request returns an **08:00:00–08:22:00** journey because a different service calendar applies.

| Setting | Default | Purpose |
| --- | --- | --- |
| `DB` | `mongo` | API adapter: `mongo` or `redis` |
| `PORT` | `3001` | API localhost port |
| `REDIS_URL` | `redis://127.0.0.1:26379` | Redis connection |
| `MONGO_URL` | `mongodb://127.0.0.1:27019` | MongoDB connection |
| `GTFS_NAMESPACE` | `demo` | Separate imported datasets |

The importer replaces only its Redis prefix `gtfs:checkpoint:<namespace>:` or the four owned collections in MongoDB database `gtfs_checkpoint_<namespace>`. **Stop the API before reimporting a namespace:** replacement is not atomic. Benchmark and integration runs use separate `benchmark` and `integration` namespaces. No importer uses `FLUSHDB` or drops an entire database. The Compose services bind to localhost, use named volumes, and are intended for local development. `npm run db:down` stops them while retaining data.

## 1. Introduction to GTFS data

General Transit Feed Specification (GTFS) standardizes public transport data. GTFS Schedule is commonly distributed as a ZIP containing related CSV text files. See the [official overview](https://gtfs.org/documentation/overview/). IDs connect the files much like relational keys:

| File | Information | Use in a planner |
| --- | --- | --- |
| `agency.txt` | Operator and timezone | Interpret service times |
| `stops.txt` | Stop identifiers, names and coordinates | Find boarding/alighting locations |
| `routes.txt` | Public-facing lines and transport modes | Identify the line used |
| `trips.txt` | Scheduled trips, route and service IDs | Connect a vehicle journey to a calendar |
| `stop_times.txt` | Ordered stop visits and arrival/departure times | Determine whether and when a trip connects two stops |
| `calendar.txt` | Weekly operation and effective date range | Activate the correct services |
| `calendar_dates.txt` | Date-specific additions/removals | Handle holidays and special service |
| Optional files | Shapes, transfers, fares, pathways and frequencies | Geometry, connections, prices and station navigation |

A planner locates nearby stops, activates services for the requested date, finds usable departures, and searches ordered stop visits for an arrival. More complete planners add walking and transfers. GTFS Realtime separately communicates delays, vehicle positions and alerts; a static timetable alone cannot promise live arrival accuracy. See the [GTFS Schedule reference](https://gtfs.org/documentation/schedule/reference/) and [Realtime reference](https://gtfs.org/documentation/realtime/reference/).

GTFS times belong to a **service day in the agency timezone** and may exceed 24 hours. A departure at `25:10:00` belongs to the preceding service date and is stored here as 90,600 seconds. `calendar_dates.txt` exceptions override the weekly calendar. Those details affect correctness as much as database speed.

## 2. Redis, MongoDB and SQL

| Aspect | Redis | MongoDB | Typical SQL database |
| --- | --- | --- | --- |
| Primary model | Keys with typed values | BSON documents in collections | Related tables and rows |
| Access model | Commands over known keys/data structures | Document filters, indexes and aggregation | Declarative SQL and joins |
| Storage | Memory-oriented, with optional persistence | Disk-backed with a memory cache | Usually disk-backed with a memory cache |
| Relationships | Application-maintained references/indexes | Embedding or references; aggregation lookups | Foreign keys and joins |
| Schema | Application-defined key conventions | Flexible documents; optional schema validation | Explicit table definitions |
| Useful features | Strings, hashes, sets, sorted sets, GEO, TTL, pipelining | Compound/geospatial indexes, aggregation, replication, sharding | Constraints, transactions and relational querying |

NoSQL does not mean “no schema,” and SQL databases can also store JSON, replicate, and scale. Redis and MongoDB support transactions with different scopes and deployment requirements; their names alone do not establish consistency or durability guarantees.

Redis is convenient for predictable, frequently accessed structures and short-lived results. MongoDB is convenient when documents need varied filters and secondary indexes. Its WiredTiger engine combines a cache, compression, checkpoints and journaling. Redis can use RDB snapshots, an append-only file (AOF), or both. See [Redis data types](https://redis.io/docs/latest/develop/data-types/compare-data-types/), [Redis persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/) and [WiredTiger](https://www.mongodb.com/docs/manual/core/wiredtiger/).

## 3. Benchmarking criteria

Measure the application operations users actually perform, under realistic selectivity, result sizes and concurrency:

| Criterion | Measurement and reason |
| --- | --- |
| Correctness | Identical calendars, boundaries, stop order and returned journeys; fast wrong answers are unusable |
| Latency | Client-observed p50, p95 and p99 for each operation; tail latency affects user experience |
| Throughput | Completed requests/second at stated concurrency, alongside error/timeout rates |
| Ingestion | CSV parsing separately from database loading and index creation; report stop-time rows/second |
| Resource use | RAM/RSS, CPU, disk/index size and, for larger tests, I/O and network traffic |
| Scalability | Repeat at increasing dataset sizes, concurrency and shard counts; examine hotspots |
| Durability/availability | State persistence and acknowledgment settings; test restart, failover and recovery separately |
| Ease of use/cost | Implementation effort, index maintenance, migrations, operations and provisioned resources |

A raw `GET` versus `findOne` microbenchmark omits calendar filtering, geospatial lookup, multiple database calls, result decoding and itinerary construction. Application-based benchmarks reveal those costs. Identical hardware, payloads, warmup, client placement and deployment settings improve comparability. Repeat runs and keep raw samples; do not infer production capacity from one laptop test.

## 4. Data ingestion and storage

For either database, obtain and unzip a GTFS Schedule feed, validate its CSV files, check IDs and references, and convert numeric fields and times. The importer accepts an **extracted directory**, not a ZIP or URL:

```powershell
npm run ingest -- path/to/extracted-feed both
# Use redis or mongo instead of both to load just one adapter.
```

The shared importer uses a CSV parser that handles quoted fields, a BOM and CRLF. It checks coordinates, duplicate IDs/sequences, references, calendars and monotonic schedules. It builds ordered trip calls and denormalized departure records without expanding every service date. Batched writes limit individual request sizes. The complete feed is parsed in process memory, so very large imports would need streaming/external grouping.

**Redis representation:** a JSON string per stop/trip; a metadata string for calendars; a GEO index of stop IDs; and one sorted set per `(stop, service)` containing departure JSON with departure seconds as the score. JSON strings use ordinary Redis `SET`/`GET`, with no RedisJSON dependency. Pipelined writes reduce round trips. A score range retrieves eligible departures efficiently; filtering and trip matching happen in Node.js. This design duplicates some data and makes the application responsible for maintaining secondary structures. See [Redis sorted sets](https://redis.io/docs/latest/develop/data-types/sorted-sets/).

**MongoDB representation:** `stops` documents include GeoJSON points, `trips` embed ordered calls, `departures` hold one document per stop visit, and `metadata` holds calendars. `_id` indexes identify stops/trips; a `2dsphere` index supports nearby stops; `{stopId:1, serviceId:1, departure:1}` supports departure filtering. The database maintains secondary indexes, with additional write/storage cost. The separate departure collection avoids scanning an embedded call array for every timetable request. See [MongoDB indexes](https://www.mongodb.com/docs/manual/indexes/) and [geospatial indexes](https://www.mongodb.com/docs/v8.0/core/indexes/index-types/index-geospatial/).

Only fields needed by this demonstration are retained. Real systems should preserve raw feed versions, validate with a full GTFS validator, stage imports and switch active versions atomically. Very large trip documents also need consideration of MongoDB's document size limit.

## 5. Query performance and examples

Three application queries run through the same `Planner` code:

1. **Nearby stops:** Redis `GEOSEARCH` or MongoDB `$near` selects stops within a radius. Results are sorted using a common distance function. The databases use slightly different geospatial approximations, so exact membership at a radius boundary can differ; benchmark coordinates avoid boundaries.
2. **Departures:** load service metadata, activate calendars, query stop/service/time ranges, exclude stops where boarding is prohibited, and sort consistently. No result limit is applied before calendar filtering.
3. **Direct journey:** load candidate departures, fetch their trips in a batch, require a later destination stop sequence and permitted alighting, then rank by earliest arrival. Repeated stops are distinguished by sequence number.

For a weekday service at S0_0, between 08:00 and 11:00 (inclusive), the underlying query examples are:

```text
# Redis: scores are seconds since the service-day time origin.
ZRANGE 'gtfs:checkpoint:demo:departures:["S0_0","WK"]' 28800 39600 BYSCORE
GEOSEARCH gtfs:checkpoint:demo:geo: FROMLONLAT -4.03 5.32 BYRADIUS 650 m
GET gtfs:checkpoint:demo:trip:T0_00002
```

```javascript
// mongosh: use gtfs_checkpoint_demo
db.departures.find({
  stopId: 'S0_0', serviceId: { $in: ['WK'] },
  departure: { $gte: 28800, $lte: 39600 }
}).sort({ departure: 1 });

db.stops.find({ location: { $near: {
  $geometry: { type: 'Point', coordinates: [-4.03, 5.32] },
  $maxDistance: 650
} } });

db.trips.find({ _id: { $in: ['T0_00002'] } });
```

The date filter must determine `WK`/`WE` before these departure queries. Neither a spatial index nor a departure index alone computes a multi-transfer itinerary. Time-dependent Dijkstra, RAPTOR or a connection-scan algorithm belongs in a routing layer, with explicit transfer and walking rules.

## 6. Reproduce the measurements

```powershell
npm run generate -- data/benchmark 10 96
npm run benchmark -- data/benchmark results/small.json
npm run generate -- data/benchmark 40 96
npm run benchmark -- data/benchmark results/large.json
```

The generator creates synthetic schedules, not a measured city's transport network. Each route has 12 stops and 96 trips split between weekday/weekend service, spread from 06:00 through after midnight. The two datasets contain 11,520 and 46,080 stop times. Increasing routes increases nearby-stop result sizes too; this is not a constant-output scaling experiment.

Each benchmark loads both adapters into the dedicated benchmark namespace and compares **144 complete result arrays**: 48 per query type, including weekdays, weekends, a calendar exception, an out-of-range date, overnight searches and some reverse-direction searches. All workloads must include nonempty results. It then performs 30 warmup requests before each timed batch, 240 measured requests per batch, three trials, and concurrency 1 and 8. Database order alternates between trials. Set `REQUESTS` and `REPEATS` to change those counts.

The report includes raw latency samples, p50/p95/p99, throughput, empty-result and returned-item counts, result checksums, database versions, environment information, feed checksum, parsing/import time and storage snapshots. Its summary takes the median of the three trial statistics. A query error or parity mismatch aborts the run instead of silently counting it as success.

Timing includes client/database round trips, calendar lookup on every request, deserialization, filtering and itinerary construction. It excludes HTTP, connection startup, parsing and loading. There is no application result cache. Warmup does not guarantee every page or code path is warm. The closed-loop load generator measures latency at a fixed number of active clients; it does not model an independent arrival rate or saturation queues.

### Measured results

See [benchmark results](results/README.md) for the recorded comparison and interpretation, and [small.json](results/small.json) / [large.json](results/large.json) for the complete measurements.

## 7. Scalability and efficiency

Redis Cluster distributes keys across hash slots. A large single sorted set or GEO key remains a single-key hotspot; split large departure structures by stop/service/time bucket and partition spatial indexes by region where appropriate. Multi-key operations need careful placement or client-side fan-out; hash tags can colocate related keys but can also concentrate traffic. This demo uses a standalone Redis client and does **not** implement a cluster deployment. Its in-memory primary structures make capacity and replication memory costs central considerations. See the [Redis Cluster specification](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/).

MongoDB shards collections across nodes and uses replica sets for availability. Choose shard keys from measured access patterns: agency/region and stop/service distribution may be useful, whereas a single popular stop can still be hot. Queries that omit the shard key may scatter across shards; a geospatial index cannot itself be the shard key. Indexes and the hot working set still benefit from RAM even when the full dataset lives on disk. This demo is standalone and measures neither sharding nor failover. See [MongoDB sharding](https://www.mongodb.com/docs/manual/sharding/) and [geospatial restrictions](https://www.mongodb.com/docs/v8.0/core/indexes/index-types/index-geospatial/).

For a large-scale application, my starting recommendation is **MongoDB for durable, versioned transit data plus Redis for selected cached departure/journey results**, with a dedicated routing layer for transfer search. If only one database is allowed, I would start with MongoDB for its flexible queries, maintained indexes and disk-backed capacity, then validate it against real workload and recovery targets. That is an architectural judgment; the small local benchmark does not establish a production winner. Cache keys would include feed version, service date, time bucket, locations and routing options, with TTL/invalidation for updates.

## 8. Practical implementation steps

The delivered application demonstrates these steps:

1. Parse and validate extracted GTFS CSV files in `src/gtfs.js`.
2. Normalize times/calendars and build ordered trip calls plus departure records.
3. Load either adapter and its indexes through `src/ingest.js` and `src/stores.js`.
4. Implement nearby-stop, departure and direct-trip operations in `src/planner.js`.
5. Expose JSON GET endpoints in `src/server.js`, validating coordinates, dates, times, window and limits.
6. Verify calendar, overnight, order and boarding rules; compare both real adapters before timing queries.
7. For deployment, add full feed validation, staged versions, authentication, observability, request limits, backups, replication and a routing algorithm with transfers.

`date` is an explicit **GTFS service date**, and `time` is an explicit service-day clock value. The API does not convert a civil timestamp to all relevant service days: to search after midnight on October 20 for October 19 service, use `date=20261019&time=25:00:00`. It also does not merge the next day's service into a long window. An ordinary user-facing planner would perform that conversion/merge, including timezone and daylight-saving behavior.

The importer deliberately supports a documented subset: timed fixed schedules, boarding stops (`location_type=0`), one agency timezone and pickup/drop-off types 0 or 1. It rejects frequency schedules, untimed intermediate calls, arranged pickup types and unsupported station rows instead of silently returning misleading journeys. It does not implement GTFS Flex, fares, accessibility routing, pathways, shapes, transfers, live updates or the complete GTFS validation rules. Redis GEO's latitude range limits both adapters in this comparison. Unknown stops or valid dates without service return empty arrays.

## 9. Conclusion

Redis offers useful indexed data structures and pipelining for predictable access patterns, at the cost of memory capacity and application-managed indexes. MongoDB offers a natural document model, broader filters and database-maintained indexes, at the cost of additional storage/index overhead and potentially more query work. Durability, consistency and operational complexity depend on configuration for both.

For the measured read operations, Redis is the stronger choice: on the larger dataset at concurrency 8, median p95 direct-trip latency was 7.09 ms versus MongoDB's 11.48 ms. For future complete GTFS applications I would choose MongoDB as the primary data store and use Redis to accelerate hot queries: that recommendation also considers data management and disk-backed capacity. The accompanying results do not prove superiority for national feeds, multi-transfer routing, replicas or distributed deployments.

## Verification

```powershell
npm test
# Include real-database tests after npm run db:up:
$env:TEST_DATABASES = '1'
npm test
```

Unit/API tests run without databases. The opt-in integration test checks expected weekday/weekend/exception/overnight journeys, direction, nearby stops and repeat imports on both databases. The benchmark adds full-result parity checks across its workload before collecting timings.
