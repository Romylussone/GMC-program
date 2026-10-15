# SQL to NoSQL Data Migration with DLoader

This checkpoint explains the migration concepts and proposes a hypothetical implementation plan. It does not claim that a migration has been executed.

## 1. Introduction to data migration

Data migration is the controlled transfer of data between systems, including any changes needed to its structure, types, or representation. A successful migration preserves the meaning of the data and allows the destination application to operate correctly.

Organizations migrate data to modernize applications, consolidate systems, replace obsolete technology, or meet changing capacity and availability requirements. Migration matters because incomplete records, incorrect transformations, or excessive downtime can disrupt business operations.

| Aspect | SQL databases | NoSQL databases |
| --- | --- | --- |
| Data model | Relational tables with rows and columns | Document, key-value, wide-column, or graph models |
| Schema | Usually explicitly defined and enforced | Varies by database; document models can allow flexible fields |
| Relationships | Often normalized, with foreign keys and joins | Often represented through embedding, references, or duplicated data |
| Querying | SQL, with implementation-specific extensions | Database-specific APIs or languages, sometimes SQL-like |
| Transactions | Typically offer ACID transactions across related tables | Guarantees and transaction scope vary by product |
| Scaling | Replication, partitioning, and distributed SQL are available | Many systems emphasize distribution and horizontal scaling |
| Modeling priority | Relationships, constraints, and query flexibility | Frequently designed around known application access patterns |

SQL schemas can evolve, and NoSQL databases still require deliberate modeling. NoSQL is not automatically faster or less consistent. For example, MongoDB supports both aggregation joins through [$lookup](https://www.mongodb.com/docs/manual/reference/operator/aggregation/lookup/) and [multi-document transactions](https://www.mongodb.com/docs/manual/core/transactions/). Query-driven design is particularly important for systems such as DynamoDB. See [AWS relational modeling guidance](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-relational-modeling.html).

## 2. Overview of DLoader

DLoader is a research framework demonstrating MySQL migration to MongoDB and Cassandra. See [Rajaram, Sharma, and Selvakumar (2023)](https://link.springer.com/chapter/10.1007/978-981-19-2358-6_19).

Its documented pipeline uses JDBC extraction, HDFS staging, Spark SQL DataFrames, and append-mode target loading. It supports timestamp-based selection of newly added data, denormalization, column mapping, renaming, type conversion, adding or removing fields, and standardizing values. Its algorithm also selects target keys and compares partition keys to track duplicates. Spark supplies distributed processing. See the [authors’ paper, sections 3.3–4](https://www.researchgate.net/publication/366776082_DLoader_Migration_of_Data_from_SQL_to_NoSQL_Databases).

Installer support, other connectors, rollback, complete change data capture (CDC), and exactly-once guarantees require separate verification.

## 3. Migration process and common challenges

For a migration using this framework, combine its extraction, staging, transformation, and loading pipeline with the following project controls. These are proposed engineering practices, not claims about built-in DLoader features.

1. **Assess the source.** Inventory tables, keys, constraints, data volumes, encodings, and application queries. Identify invalid or duplicate records.
2. **Design the destination.** Choose document boundaries or partition keys based on actual reads and writes. Decide which relationships to embed or reference.
3. **Define mappings.** Record the destination field, type, null policy, and validation rule for every source field.
4. **Prepare recovery.** Back up the source, test restoration, and agree on downtime and rollback conditions.
5. **Establish a consistent extraction boundary.** Pause writes or use a coordinated snapshot. Independent table reads can otherwise represent different moments.
6. **Extract and transform.** Apply the documented pipeline using explicit, repeatable mapping rules.
7. **Load an isolated target.** Track each migration attempt and keep incomplete output away from application traffic.
8. **Validate and cut over.** Reconcile records and business totals, test application behavior, and switch only when acceptance criteria pass.

| Challenge | Proposed response |
| --- | --- |
| Relational data does not fit the target model | Model around application queries; embed bounded child data and reference large or shared entities |
| Unsupported types or precision loss | Define explicit conversions; retain monetary values as exact decimals or integer minor units |
| Missing parents, duplicates, or invalid values | Validate before loading; quarantine rejected records with their source IDs |
| Source changes during copying | Use a write pause or a separately implemented snapshot-plus-CDC strategy |
| Partial failures and retries | Use isolated staging and deterministic IDs; rebuild failed attempts or implement tested idempotent writes |
| Application incompatibility | Rewrite affected queries and test business operations before switching |

A timestamp filter alone can miss deletes and changes whose timestamps are unreliable. It also does not solve transaction ordering or updates to previously embedded child records.

## 4. Data transformation

The project must supply the business meaning of its transformation rules.

For a hypothetical store, useful transformations include:

| Source representation | Proposed destination representation | Reason |
| --- | --- | --- |
| Orders and OrderItems tables | One order document with an items array | Retrieve an order and its bounded line items together |
| Numeric primary key | Stable string-valued _id | Preserve identity consistently across extraction, loading, and retries |
| DECIMAL price in USD | Integer priceCents | Preserve exact amounts without floating-point rounding |
| DATETIME with a documented source timezone | UTC BSON date | Give timestamps an unambiguous meaning |
| SQL NULL | Explicit null or omitted field, according to a written rule | Avoid silently changing the meaning of missing values |
| Padded text fields | Trimmed text where business rules allow | Remove accidental whitespace without changing meaningful content |

Do not infer a missing timezone or convert invalid values silently. Reject ambiguous dates for review. Keep numeric-looking identifiers such as telephone numbers as strings when leading zeros matter.

MongoDB supports both embedded data and references; the choice should reflect access and update patterns. See [MongoDB data modeling](https://www.mongodb.com/docs/manual/data-modeling/).

## 5. Performance considerations

Measure source read capacity, network throughput, staging storage, transformation CPU and memory, target write capacity, and index maintenance. Also consider join-related data shuffles, uneven partition sizes, replication overhead, and the application's latency during migration.

Distributed processing can help, but throughput must be measured for the chosen workload.

For an implementation, I would:

- Extract only required columns and records, while preserving the agreed snapshot boundary.
- Tune JDBC read partitions and connection counts without overwhelming MySQL.
- Benchmark several write batch sizes and concurrency levels against representative data.
- Inspect Spark partition skew, shuffle volume, and disk spills.
- Keep required uniqueness protections during loading; assess whether optional indexes can be built afterward.
- Monitor rows per second, rejected records, CPU, memory, network, and target latency.

A rough lower bound is data volume divided by the slowest effective pipeline throughput. Add time for transformation, validation, index creation, and cutover. Benchmark the entire process before committing to a downtime window.

## 6. Consistency, integrity, and verification

DLoader's duplicate-tracking step is a limited safeguard, not proof of complete integrity. In particular, Cassandra partition keys can legitimately repeat across different clustering keys.

For a production implementation, consistency and integrity must also come from the extraction boundary, correct mapping rules, complete identity keys, destination validation, acknowledged writes, and independent reconciliation.

I would verify the migration using:

- **Identity coverage:** Compare source and target ID sets to identify missing and unexpected entities.
- **Counts by entity:** Compare customers to customer documents and orders to order documents. Compare item-row counts to total embedded item counts.
- **Business totals:** Compare order quantities and exact monetary totals, both globally and per order.
- **Relationships:** Check that every order's customer reference resolves and every source item appears under its intended order.
- **Canonical comparisons:** Transform source records into the expected destination shape, sort arrays deterministically, normalize dates and nulls, and compare values or hashes.
- **Application behavior:** Test customer history, order details, updates, and failure scenarios.
- **Replay behavior:** Repeat a failed batch or full staging attempt and confirm that the approved retry strategy produces the same result.

Counts alone cannot detect swapped values or equally sized sets of missing and extra records. Record all rejected rows; unexplained omissions must prevent cutover.

## 7. Practical application: a hypothetical online store

Assume a small MySQL store with 1,000 customers, 5,000 orders, and 15,000 order items. The store can accept a maintenance window whose duration will be established by rehearsal. Its main queries retrieve an order and list a customer's recent orders.

The source schema is:

~~~text
Customers(customer_id PK, name, email)
Orders(order_id PK, customer_id FK, ordered_at, currency)
OrderItems(item_id PK, order_id FK, product_id, quantity, unit_price DECIMAL(10,2))
~~~

The proposed destination has separate customers and orders collections. Orders reference customers and embed line items. A customer's order history stays in the orders collection, avoiding an ever-growing array inside the customer document.

Example order document, shown using MongoDB Extended JSON for the date:

~~~json
{
  "_id": "1001",
  "customerId": "42",
  "orderedAt": { "$date": "2026-10-01T10:30:00Z" },
  "currency": "USD",
  "items": [
    {
      "itemId": "9001",
      "productId": "501",
      "quantity": 2,
      "unitPriceCents": 2500
    }
  ],
  "totalCents": 5000
}
~~~

This example assumes USD amounts with two decimal places and a known source timezone. A multi-currency system needs currency-specific conversion rules. Orders must remain within MongoDB's [16 MiB BSON document limit](https://www.mongodb.com/docs/manual/reference/limits/); unusually large orders need a separate item model.

I would implement the plan as follows:

1. **Write the mapping specification.** Preserve IDs as strings, convert prices exactly to cents, document timezone handling, and define whether an empty order is valid. Retain item IDs so identical product lines are not accidentally collapsed.
2. **Prepare the environment.** Obtain the framework implementation or implement its published design. Configure compatible Spark, Hadoop/HDFS, JDBC, and MongoDB connector versions. Keep credentials outside source files and verify access in a test environment.
3. **Create an isolated destination.** Use a fresh migration database for each attempt. Define required field/type rules and an orders index on customerId and orderedAt. Preserve unique _id values.
4. **Rehearse.** Test representative records, including empty orders, duplicate-looking items, null fields, invalid dates, and non-ASCII names. Measure the complete migration duration and test restoration.
5. **Freeze and capture.** Pause every source writer, including background jobs; drain outstanding transactions. Back up MySQL and record counts and business totals. Keep writes paused through final validation and cutover.
6. **Run the pipeline.** Extract the three tables, stage them, and construct the mapped output. Group items by order_id, sort by item_id, attach the arrays to their orders, and calculate totalCents using exact arithmetic. Preserve orders with no items according to the agreed rule.
7. **Load and reconcile.** Write customers and orders into the isolated destination. Compare the expected 1,000 customers, 5,000 orders, and 15,000 embedded items, then perform the identity, value, relationship, and total checks above. If a load fails, discard only that attempt's staging destination and rebuild it from the frozen source.
8. **Switch and smoke-test.** Configure the application to use MongoDB while writes remain paused. Verify order retrieval and customer history, and compare measured latency with the agreed target.
9. **Resume and monitor.** Enable writes after acceptance. Retain the source backup and migration manifest under an agreed retention policy. Before new target writes, rollback can switch back to the frozen source. After new target writes, rollback requires reconciling those changes first.

Acceptance requires complete ID coverage, matching entity and item counts, matching exact totals, no unexplained rejected records, successful application checks, and completion within the rehearsed downtime window. No live database credentials or DLoader runtime were provided, so this remains a design exercise.

## 8. Case studies and lessons

**Amazon: Oracle to purpose-built AWS databases.** Amazon reported migrating 75 PB from nearly 7,500 Oracle databases to a mixture of relational and non-relational services. Its Financial Ledger example moved 120 TB to DynamoDB and reported lower latency and costs. These figures describe Amazon's experience, not guaranteed outcomes. See the [2019 Amazon migration report](https://aws.amazon.com/blogs/aws/migration-complete-amazons-consumer-business-just-turned-off-its-final-oracle-database/).

My takeaway is to choose a destination separately for each workload and measure both operating costs and application behavior. Amazon's broader migration included relational targets, so it should not be described as an entirely SQL-to-NoSQL conversion.

**Netflix: Oracle to cloud NoSQL storage.** Netflix engineer Sid Anand described moving from Oracle in its data center to SimpleDB and S3, and subsequently to Cassandra. See his firsthand presentation, [NoSQL @ Netflix](https://www.infoq.com/presentations/NoSQL-Netflix/).

My takeaway is to plan for changes to both the application and its operating environment. The later SimpleDB-to-Cassandra stage is a NoSQL-to-NoSQL migration and should be distinguished from the initial relational transition.

These cases illustrate migration decisions at scale; neither source establishes that the organization used DLoader.

## 9. Conclusion and recommendation

Moving to a suitable NoSQL model can improve access to aggregate data, support changing document structures, and meet distribution or availability requirements. The tradeoffs can include duplicated data, more complicated updates, rewritten queries, additional application-level relationship checks, and operational costs. Benefits depend on the selected database and workload.

I would consider DLoader for a learning project or a prototype involving substantial MySQL data, MongoDB or Cassandra targets, and a team able to implement and operate Spark/Hadoop. A production choice should follow verification of implementation availability, connector compatibility, recovery behavior, and reconciliation results.

For a small one-time move, a simpler ETL job may be easier to operate. For continuous replication or strict downtime requirements, choose or add a tested CDC and recovery solution. The deciding factor is whether the migration approach can preserve business meaning and meet measured application requirements.
