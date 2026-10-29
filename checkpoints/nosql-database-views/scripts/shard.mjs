import { MongoClient } from 'mongodb';
import { setupSchema } from '../src/schema.mjs';

// Run against an EXISTING sharded cluster with >=2 registered replica-set shards.
if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI to a mongos connection string');
const client = new MongoClient(process.env.MONGODB_URI);
try {
  await client.connect();
  const admin = client.db('admin');
  const hello = await admin.command({ hello: 1 });
  if (hello.msg !== 'isdbgrid') throw new Error('Connect through mongos, not a replica set member');
  const { shards } = await admin.command({ listShards: 1 });
  if (shards.length < 2) throw new Error('Register at least two replica-set shards first');
  const db = client.db('ecommerce_refactored');
  await setupSchema(db, { refactored: true });
  await admin.command({ enableSharding: db.databaseName });
  for (const name of ['orders', 'sales_facts', 'daily_product_sales']) {
    await db.collection(name).createIndex({ _id: 'hashed' }, { name: 'distribution_key' });
    await admin.command({ shardCollection: `${db.databaseName}.${name}`, key: { _id: 'hashed' } });
    console.log(`Sharded ${name} by hashed _id`);
  }
} finally {
  await client.close();
}
