# E-commerce NoSQL database design

A MongoDB implementation of an initial e-commerce schema and a refactor for analytics, horizontal scaling, and availability. Both versions have executable validators, indexes, sample documents, and query examples.

## Deliverables

| Deliverable | Design report | Executable implementation |
| --- | --- | --- |
| Initial schema | [Initial design](docs/initial-design.md) | [Validators and indexes](src/schema.mjs), [order operations](src/orders.mjs) |
| Refactored schema | [Refactored design](docs/refactored-design.md) | [Analytics and migration](src/analytics.mjs), [sharding commands](scripts/shard.mjs) |
| Reflection | [Reflection report, 200–300 words](docs/reflection.md) | — |

## Run the exercise

Requires **Node.js 20.19+** and npm. No MongoDB account or Docker installation is needed for the default demo.

```sh
npm ci
npm test
npm run demo
```

The first demo/test run downloads **MongoDB 8.0.17** into `.cache/mongodb-binaries` and starts a temporary single-member replica set. Network access is required for the download. The database files are discarded when it stops. A single member supports transactions but provides no replica redundancy; the production topology is described in the refactored design.

The demo:

1. Creates `ecommerce_initial` and `ecommerce_refactored` with separate validators.
2. Seeds two products and a customer, then stores a paid order in the initial database.
3. Searches the catalog for `wireless`.
4. Copies the initial data into the refactored database and backfills immutable sales facts.
5. Creates a second order and its sales facts in one transaction.
6. Materializes daily sales and prints product rankings.

Expected rankings, in **USD cents**:

```text
product-001: units = 4, revenueMinor = 20000
product-002: units = 2, revenueMinor = 3000
```

To retain the demo data, connect to your own replica set or `mongos` instead. Use the dedicated exercise database names above; the demo creates collections, configures validators, and inserts sample data in them. For PowerShell:

```powershell
$env:MONGODB_URI = 'mongodb://localhost:27017/?replicaSet=rs0'
npm run demo
```

Tests always use an isolated temporary replica set and ignore `MONGODB_URI`. They cover schema rejection, search, uniqueness, snapshot preservation, retry conflicts, concurrent status updates, migration replay, transaction rollback, and analytics replay/late arrivals/reversals/currency separation. They do **not** benchmark thousands of transactions per second or exercise a sharded cluster or replica failover.

## Configure sharding

Provision an existing cluster with at least two registered replica-set shards first. Connect through `mongos`, using a database administration account:

```powershell
$env:MONGODB_URI = 'mongodb://mongos-a:27017,mongos-b:27017/'
npm run shard
```

This creates the refactored schema and shards `orders`, `sales_facts`, and `daily_product_sales` on hashed `_id`. It does not provision servers or configure replication. Production requires authentication, TLS, restricted network access, least-privilege accounts, backups, and the multi-zone topology in the [refactored design](docs/refactored-design.md).

## GitHub submission

After committing and pushing this checkpoint to the existing repository's `master` branch, its submission URL is:

[github.com/Romylussone/GMC-program/tree/master/checkpoints/nosql-database-views](https://github.com/Romylussone/GMC-program/tree/master/checkpoints/nosql-database-views)

The URL identifies the intended location; creating these local files does not publish them.
