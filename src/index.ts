import 'dotenv/config';
import { getRawCalendar, getUpcomingWorkouts } from './garmin';
import { syncWorkouts, resyncAll } from './sync';
import { listCalendars } from './caldav';

const command = process.argv[2];

async function main(): Promise<void> {
  switch (command) {
    case 'fetch':
      console.log('Fetching raw calendar from Garmin...\n');
      const raw = await getRawCalendar();
      console.log(JSON.stringify(raw, null, 2));
      break;

    case 'workouts':
      console.log('Fetching upcoming planned workouts...\n');
      const workouts = await getUpcomingWorkouts();
      console.log(JSON.stringify(workouts, null, 2));
      console.log(`\nTotal: ${workouts.length} workouts`);
      break;

    case 'durations': {
      console.log('Workout durations (Garmin vs calendar event):\n');
      const extraMin = Number(process.env.EXTRA_MINUTES ?? 0);
      const ws = await getUpcomingWorkouts();
      const pad = (s: string, n: number) => s.padEnd(n);
      console.log(pad('Data', 12) + pad('Garmin', 10) + pad(`+${extraMin}min`, 10) + 'Titolo');
      console.log('─'.repeat(80));
      for (const w of ws) {
        const garminMin = Math.round(w.durationSeconds / 60);
        const totalMin = garminMin + extraMin;
        const fmt = (m: number) => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`;
        console.log(pad(w.date, 12) + pad(fmt(garminMin), 10) + pad(fmt(totalMin), 10) + w.title);
      }
      break;
    }

    case 'calendars':
      await listCalendars();
      break;

    case 'detail': {
      const { GarminConnect } = await import('garmin-connect');
      const gc = new GarminConnect({ username: process.env.GARMIN_EMAIL!, password: process.env.GARMIN_PASSWORD! });
      await gc.login();
      const wid = process.argv[3];
      if (!wid) { console.error('Usage: ts-node src/index.ts detail <workoutTemplateId>'); break; }
      const detail = await gc.getWorkoutDetail({ workoutId: wid });
      console.log(JSON.stringify(detail, null, 2));
      break;
    }

    case 'resync':
      await resyncAll();
      break;

    case 'sync':
      await syncWorkouts();
      break;

    default:
      console.log('Usage:');
      console.log('  npm run fetch      — print raw JSON from Garmin (debug)');
      console.log('  npm run workouts   — print parsed upcoming workouts');
      console.log('  npm run calendars  — list available CalDAV calendars');
      console.log('  npm run sync       — sync workouts to CalDAV calendar');
      console.log('  npm run resync     — force-update all events');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
