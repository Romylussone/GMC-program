import { activeServices, seconds, clock } from './gtfs.js';

const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;

export class Planner {
  constructor(store) { this.store = store; }
  async departures({ stop, date, time, window = 3600 }) {
    if (!stop || !Number.isInteger(window) || window < 1 || window > 172800) throw new Error('Invalid stop/window');
    const start = seconds(time);
    const metadata = await this.store.metadata();
    const services = activeServices(metadata, date);
    return (await this.store.departures(stop, services, start, start + window))
      .filter(d => d.pickup === '0')
      .sort((a, b) => a.departure - b.departure || compare(a.tripId, b.tripId) || a.seq - b.seq);
  }
  async plan({ from, to, date, time, window = 86400, limit = 5 }) {
    if (!from || !to || from === to || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error('Use different from/to stops and a limit from 1 to 100');
    }
    const candidates = await this.departures({ stop: from, date, time, window });
    const trips = new Map((await this.store.trips([...new Set(candidates.map(c => c.tripId))])).map(t => [t.id, t]));
    const result = [];
    for (const c of candidates) {
      const trip = trips.get(c.tripId);
      if (!trip) throw new Error('Incomplete feed: missing trip');
      for (const dest of trip.calls) {
        if (dest.stopId === to && dest.seq > c.seq && dest.dropOff === '0') {
          result.push({ tripId: c.tripId, routeId: c.routeId, from, to, fromSeq: c.seq, toSeq: dest.seq,
            serviceDate: date, departure: clock(c.departure), arrival: clock(dest.arrival),
            departureSeconds: c.departure, arrivalSeconds: dest.arrival, durationSeconds: dest.arrival - c.departure });
        }
      }
    }
    return result.sort((a, b) => a.arrivalSeconds - b.arrivalSeconds || a.departureSeconds - b.departureSeconds
      || compare(a.tripId, b.tripId) || a.fromSeq - b.fromSeq || a.toSeq - b.toSeq).slice(0, limit);
  }
  async nearby({ lon, lat, radius = 1000 }) {
    if (![lon, lat, radius].every(Number.isFinite) || Math.abs(lon) > 180 || Math.abs(lat) > 85.05112878
      || radius <= 0 || radius > 10000) throw new Error('Invalid coordinates/radius (maximum 10000 m)');
    // Both indexes select candidates. Sort with the same distance function for deterministic output.
    const rad = n => n * Math.PI / 180;
    const distance = s => {
      const a = Math.sin(rad(s.lat - lat) / 2) ** 2
        + Math.cos(rad(lat)) * Math.cos(rad(s.lat)) * Math.sin(rad(s.lon - lon) / 2) ** 2;
      return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, a)));
    };
    return (await this.store.nearby(lon, lat, radius))
      .sort((a, b) => distance(a) - distance(b) || compare(a.id, b.id));
  }
}
