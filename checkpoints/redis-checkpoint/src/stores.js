import { createClient } from 'redis';
import { MongoClient } from 'mongodb';

const chunks = function* (items, size = 500) {
  for (let i = 0; i < items.length; i += size) yield items.slice(i, i + size);
};

export async function openStore(kind, namespace = process.env.GTFS_NAMESPACE || 'demo') {
  if (!/^[a-zA-Z0-9_-]+$/.test(namespace)) throw new Error('Invalid namespace');
  if (kind === 'redis') return RedisStore.open(namespace);
  if (kind === 'mongo') return MongoStore.open(namespace);
  throw new Error('Database must be redis or mongo');
}

class RedisStore {
  static async open(namespace) {
    const store = new RedisStore();
    store.prefix = `gtfs:checkpoint:${namespace}:`;
    store.client = createClient({ url: process.env.REDIS_URL || 'redis://127.0.0.1:26379',
      socket: { connectTimeout: 5000, reconnectStrategy: false } });
    store.client.on('error', error => console.error('Redis:', error.message));
    await store.client.connect();
    return store;
  }
  key(type, id = '') { return `${this.prefix}${type}:${id}`; }
  async close() { await this.client.quit(); }
  async import(feed) {
    // Never use FLUSHDB: only keys belonging to this checkpoint namespace are replaced.
    const keys = [];
    for await (const key of this.client.scanIterator({ MATCH: `${this.prefix}*`, COUNT: 1000 })) keys.push(key);
    for (const batch of chunks(keys)) await this.client.unlink(batch);
    for (const batch of chunks(feed.stops)) {
      const pipeline = this.client.multi();
      for (const s of batch) {
        pipeline.set(this.key('stop', s.id), JSON.stringify(s));
        pipeline.geoAdd(this.key('geo'), { longitude: s.lon, latitude: s.lat, member: s.id });
      }
      await pipeline.execAsPipeline();
    }
    for (const batch of chunks(feed.trips)) {
      const pipeline = this.client.multi();
      for (const t of batch) pipeline.set(this.key('trip', t.id), JSON.stringify(t));
      await pipeline.execAsPipeline();
    }
    for (const batch of chunks(feed.departures)) {
      const pipeline = this.client.multi();
      for (const d of batch) pipeline.zAdd(this.key('departures', JSON.stringify([d.stopId, d.serviceId])), {
        score: d.departure, value: JSON.stringify(d),
      });
      await pipeline.execAsPipeline();
    }
    await this.client.set(this.key('metadata'), JSON.stringify(feed.metadata));
  }
  async metadata() {
    const value = await this.client.get(this.key('metadata'));
    if (!value) throw new Error('No complete feed imported; run npm run ingest');
    return JSON.parse(value);
  }
  async departures(stopId, services, start, end) {
    if (!services.length) return [];
    const pipeline = this.client.multi();
    for (const service of services) pipeline.zRangeByScore(
      this.key('departures', JSON.stringify([stopId, service])), start, end);
    return (await pipeline.execAsPipeline()).flat().map(JSON.parse);
  }
  async trips(ids) {
    if (!ids.length) return [];
    const pipeline = this.client.multi();
    for (const id of ids) pipeline.get(this.key('trip', id));
    return (await pipeline.execAsPipeline()).filter(Boolean).map(JSON.parse);
  }
  async nearby(lon, lat, radius) {
    const ids = await this.client.geoSearch(this.key('geo'), { longitude: lon, latitude: lat }, {
      radius, unit: 'm',
    });
    if (!ids.length) return [];
    const pipeline = this.client.multi();
    for (const id of ids) pipeline.get(this.key('stop', id));
    return (await pipeline.execAsPipeline()).filter(Boolean).map(JSON.parse);
  }
  async stats() {
    const info = await this.client.info();
    const field = name => info.match(new RegExp(`^${name}:(.+)`, 'm'))?.[1].trim();
    let namespaceKeys = 0;
    for await (const key of this.client.scanIterator({ MATCH: `${this.prefix}*`, COUNT: 1000 })) namespaceKeys++;
    return { version: field('redis_version'), usedMemoryBytes: Number(field('used_memory')),
      rssBytes: Number(field('used_memory_rss')), namespaceKeys,
      note: 'Memory is a whole-server snapshot including other namespaces, allocator and server overhead.' };
  }
}

class MongoStore {
  static async open(namespace) {
    const store = new MongoStore();
    store.client = new MongoClient(process.env.MONGO_URL || 'mongodb://127.0.0.1:27019', {
      serverSelectionTimeoutMS: 5000, maxPoolSize: 32,
      writeConcern: { w: 1, j: true },
    });
    await store.client.connect();
    store.db = store.client.db(`gtfs_checkpoint_${namespace}`);
    return store;
  }
  async close() { await this.client.close(); }
  async import(feed) {
    // Only these four collections in gtfs_checkpoint_<namespace> belong to the importer.
    for (const name of ['stops', 'trips', 'departures', 'metadata']) {
      try { await this.db.collection(name).drop(); }
      catch (error) { if (error.code !== 26) throw error; }
    }
    for (const [name, records] of [
      ['stops', feed.stops.map(s => ({ ...s, _id: s.id, location: { type: 'Point', coordinates: [s.lon, s.lat] } }))],
      ['trips', feed.trips.map(t => ({ ...t, _id: t.id }))],
      ['departures', feed.departures.map(d => ({ ...d }))],
    ]) {
      for (const batch of chunks(records)) await this.db.collection(name).insertMany(batch, { ordered: false });
    }
    await this.db.collection('stops').createIndex({ location: '2dsphere' });
    await this.db.collection('departures').createIndex({ stopId: 1, serviceId: 1, departure: 1 });
    await this.db.collection('metadata').insertOne({ _id: 'feed', ...feed.metadata });
  }
  async metadata() {
    const result = await this.db.collection('metadata').findOne({ _id: 'feed' }, { projection: { _id: 0 } });
    if (!result) throw new Error('No complete feed imported; run npm run ingest');
    return result;
  }
  async departures(stopId, services, start, end) {
    if (!services.length) return [];
    return this.db.collection('departures').find({ stopId, serviceId: { $in: services },
      departure: { $gte: start, $lte: end } }, { projection: { _id: 0 } }).toArray();
  }
  async trips(ids) {
    if (!ids.length) return [];
    return this.db.collection('trips').find({ _id: { $in: ids } }, { projection: { _id: 0 } }).toArray();
  }
  async nearby(lon, lat, radius) {
    return this.db.collection('stops').find({ location: { $near: {
      $geometry: { type: 'Point', coordinates: [lon, lat] }, $maxDistance: radius,
    } } }, { projection: { _id: 0, location: 0 } }).toArray();
  }
  async stats() {
    const [build, stats, server] = await Promise.all([
      this.db.admin().command({ buildInfo: 1 }), this.db.command({ dbStats: 1 }),
      this.db.admin().command({ serverStatus: 1 }),
    ]);
    return { version: build.version, dataBytes: stats.dataSize, storageBytes: stats.storageSize,
      indexBytes: stats.indexSize, rssBytes: server.mem.resident * 1024 * 1024,
      note: 'dataBytes is logical BSON; storage/index bytes are allocated disk; RSS includes the whole server.' };
  }
}
