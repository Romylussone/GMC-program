import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { clock } from './gtfs.js';

export async function generate(dir, routeCount = 2, tripsPerRoute = 12) {
  if (![routeCount, tripsPerRoute].every(n => Number.isInteger(n) && n > 0 && n <= 10000)) {
    throw new Error('Route and trip counts must be integers from 1 to 10000');
  }
  await mkdir(dir, { recursive: true });
  const files = {
    'agency.txt': ['agency_id,agency_name,agency_url,agency_timezone', 'demo,Demo Transit,https://example.com,Etc/UTC'],
    'stops.txt': ['stop_id,stop_name,stop_lat,stop_lon'],
    'routes.txt': ['route_id,agency_id,route_short_name,route_long_name,route_type'],
    'trips.txt': ['route_id,service_id,trip_id'],
    'stop_times.txt': ['trip_id,arrival_time,departure_time,stop_id,stop_sequence,pickup_type,drop_off_type'],
    'calendar.txt': ['service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date',
      'WK,1,1,1,1,1,0,0,20260101,20261231', 'WE,0,0,0,0,0,1,1,20260101,20261231'],
    'calendar_dates.txt': ['service_id,date,exception_type', 'WK,20260105,2', 'WE,20260105,1'],
  };
  for (let r = 0; r < routeCount; r++) {
    files['routes.txt'].push(`R${r},demo,${r},Demo Route ${r},3`);
    for (let s = 0; s < 12; s++) {
      files['stops.txt'].push(`S${r}_${s},Route ${r} Stop ${s},${5.32 + s * 0.002},${-4.03 + r * 0.001}`);
    }
    for (let t = 0; t < tripsPerRoute; t++) {
      const id = `T${r}_${String(t).padStart(5, '0')}`;
      files['trips.txt'].push(`R${r},${t % 2 ? 'WE' : 'WK'},${id}`);
      const start = 21600 + Math.floor(t * 86400 / tripsPerRoute);
      for (let s = 0; s < 12; s++) {
        const time = clock(start + s * 120);
        files['stop_times.txt'].push(`${id},${time},${time},S${r}_${s},${s},0,0`);
      }
    }
  }
  await Promise.all(Object.entries(files).map(([name, lines]) => writeFile(join(dir, name), `${lines.join('\n')}\n`)));
  return { routes: routeCount, stops: routeCount * 12, trips: routeCount * tripsPerRoute, stopTimes: routeCount * tripsPerRoute * 12 };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const dir = process.argv[2] || 'data/sample';
  console.log(await generate(dir, Number(process.argv[3] || 2), Number(process.argv[4] || 12)));
}
