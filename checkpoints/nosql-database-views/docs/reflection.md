# Reflection report

The main challenge in this refactor was preserving trustworthy order data while adding analytical representations. A customer order needs an accurate purchase snapshot and predictable delivery transitions, whereas a dashboard benefits from compact totals that can be refreshed later. Reusing live product prices during aggregation would distort historical sales, so I retained the purchased prices and quantities in immutable sale facts.

The analytics requirement led me to separate operational orders from daily product summaries. I chose deterministic fact identifiers and transactional order creation to avoid missing or duplicated sales during retries. Refreshing summaries replaces complete daily totals rather than incrementing existing values, making replay safe. Late arrivals require refreshing their original event windows, and refunds require signed adjustment facts. These decisions add storage, coordination, and reconciliation work.

Higher traffic also changed the distribution strategy. Hashing order identifiers spreads incoming writes across shards, while replica sets provide redundant copies and automatic elections. The trade-off is that customer history and date-range analytics may contact several shards. Keeping the catalog unsharded preserves straightforward text search and unique product codes, but leaves a capacity boundary that caching or a separate search service may eventually address.

The availability requirement required a careful interpretation. Majority-acknowledged checkout writes remain unavailable when the required majority cannot be reached; replication cannot eliminate that consistency trade-off. Catalog browsing and dashboards can tolerate older data and therefore remain useful through more failures.

The refactor improves scalability through distributed writes and improves dashboard performance through smaller materialized datasets. Integration tests validate data correctness, but production throughput, failover timing, and analytical isolation still require workload and failure testing on the intended cluster.
