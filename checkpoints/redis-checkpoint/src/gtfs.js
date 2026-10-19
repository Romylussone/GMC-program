import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'csv-parse/sync';

export function seconds(value) {
  if (!/^\d{2,}:\d{2}:\d{2}$/.test(value)) throw new Error('Time must be HH:MM:SS');
  const [h, m, s] = value.split(':').map(Number);
  if (m > 59 || s > 59 || !Number.isSafeInteger(h * 3600 + m * 60 + s)) {
    throw new Error('Invalid GTFS time');
  }
  return h * 3600 + m * 60 + s;
}

export function clock(value) {
  return [Math.floor(value / 3600), Math.floor(value / 60) % 60, value % 60]
    .map(v => String(v).padStart(2, '0')).join(':');
}

export function serviceDate(value) {
  if (!/^\d{8}$/.test(value)) throw new Error('Date must be YYYYMMDD');
  const d = new Date(`${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6)}T12:00:00Z`);
  if (Number.isNaN(d.valueOf()) || d.toISOString().slice(0, 10).replaceAll('-', '') !== value) {
    throw new Error('Invalid service date');
  }
  return d;
}

export function activeServices(metadata, date) {
  const d = serviceDate(date);
  const weekday = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][d.getUTCDay()];
  const active = new Set(metadata.calendar
    .filter(c => c.start_date <= date && c.end_date >= date && c[weekday] === '1')
    .map(c => c.service_id));
  for (const c of metadata.exceptions.filter(c => c.date === date)) {
    if (c.exception_type === '1') active.add(c.service_id);
    else active.delete(c.service_id);
  }
  return [...active].sort();
}

async function csv(dir, file, optional = false) {
  try {
    return parse(await readFile(join(dir, file), 'utf8'), {
      columns: true, bom: true, skip_empty_lines: true,
    });
  } catch (error) {
    if (optional && error.code === 'ENOENT') return [];
    throw error;
  }
}

function unique(rows, key) {
  const map = new Map();
  for (const row of rows) {
    if (!row[key] || map.has(row[key])) throw new Error(`Missing or duplicate ${key}`);
    map.set(row[key], row);
  }
  return map;
}

export async function loadGtfs(dir) {
  const [agencies, rawStops, routes, rawTrips, calls, calendar, exceptions, frequencies] = await Promise.all([
    csv(dir, 'agency.txt'), csv(dir, 'stops.txt'), csv(dir, 'routes.txt'),
    csv(dir, 'trips.txt'), csv(dir, 'stop_times.txt'), csv(dir, 'calendar.txt', true),
    csv(dir, 'calendar_dates.txt', true), csv(dir, 'frequencies.txt', true),
  ]);
  if (!agencies.length || new Set(agencies.map(a => a.agency_timezone)).size !== 1) {
    throw new Error('This demo requires one agency timezone');
  }
  new Intl.DateTimeFormat('en', { timeZone: agencies[0].agency_timezone });
  if (frequencies.length) throw new Error('Frequency-based trips must be expanded before import');
  if (!calendar.length && !exceptions.length) throw new Error('Missing service calendar');
  unique(calendar, 'service_id');
  const exceptionKeys = new Set();
  for (const c of calendar) {
    serviceDate(c.start_date); serviceDate(c.end_date);
    if (c.start_date > c.end_date || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      .some(day => !['0', '1'].includes(c[day]))) throw new Error('Invalid calendar');
  }
  for (const c of exceptions) {
    serviceDate(c.date);
    const key = JSON.stringify([c.service_id, c.date]);
    if (!c.service_id || !['1', '2'].includes(c.exception_type) || exceptionKeys.has(key)) {
      throw new Error('Invalid or duplicate calendar exception');
    }
    exceptionKeys.add(key);
  }
  const stops = [...unique(rawStops, 'stop_id').values()].map(s => {
    const lon = Number(s.stop_lon), lat = Number(s.stop_lat);
    if (!s.stop_lon || !s.stop_lat || !Number.isFinite(lon) || !Number.isFinite(lat)
      || Math.abs(lon) > 180 || Math.abs(lat) > 85.05112878) throw new Error('Invalid/unsupported stop coordinates');
    if (s.location_type && s.location_type !== '0') throw new Error('Import boarding stops only (location_type=0)');
    return { id: s.stop_id, name: s.stop_name, lon, lat };
  });
  const stopIds = new Set(stops.map(s => s.id));
  const routeIds = unique(routes, 'route_id');
  const services = new Set([...calendar, ...exceptions].map(c => c.service_id));
  const trips = [...unique(rawTrips, 'trip_id').values()].map(t => {
    if (!routeIds.has(t.route_id) || !services.has(t.service_id)) throw new Error('Unknown route/service');
    return { id: t.trip_id, routeId: t.route_id, serviceId: t.service_id, calls: [] };
  });
  const tripMap = new Map(trips.map(t => [t.id, t]));
  for (const c of calls) {
    const trip = tripMap.get(c.trip_id);
    if (!trip || !stopIds.has(c.stop_id)) throw new Error('Unknown trip/stop in stop_times');
    const seq = Number(c.stop_sequence);
    const pickup = c.pickup_type || '0', dropOff = c.drop_off_type || '0';
    if (!/^\d+$/.test(c.stop_sequence) || !Number.isSafeInteger(seq) || seq < 0 || !['0', '1'].includes(pickup)
      || !['0', '1'].includes(dropOff)) throw new Error('Invalid sequence or unsupported pickup/drop-off type');
    const arrival = seconds(c.arrival_time), departure = seconds(c.departure_time);
    if (arrival > departure) throw new Error('Arrival after departure');
    trip.calls.push({ stopId: c.stop_id, seq, arrival, departure, pickup, dropOff });
  }
  const departures = [];
  for (const t of trips) {
    t.calls.sort((a, b) => a.seq - b.seq);
    if (t.calls.length < 2) throw new Error('Trip needs at least two timed stops');
    for (let i = 0; i < t.calls.length; i++) {
      const c = t.calls[i], prev = t.calls[i - 1];
      if (prev && (prev.seq === c.seq || prev.departure > c.arrival)) throw new Error('Non-monotonic trip');
      departures.push({ ...c, tripId: t.id, routeId: t.routeId, serviceId: t.serviceId });
    }
  }
  return { stops, trips, departures, metadata: { timezone: agencies[0].agency_timezone, calendar, exceptions } };
}
