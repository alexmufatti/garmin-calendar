import { GarminConnect } from 'garmin-connect';
import { addDays, format } from 'date-fns';
import { GarminWorkout } from './types';

const GC_API = 'https://connectapi.garmin.com';

async function createClient(): Promise<GarminConnect> {
  const gc = new GarminConnect({
    username: process.env.GARMIN_EMAIL!,
    password: process.env.GARMIN_PASSWORD!,
  });
  await gc.login();
  return gc;
}

async function fetchCalendarMonth(gc: GarminConnect, year: number, month: number): Promise<any> {
  return gc.get(`${GC_API}/calendar-service/year/${year}/month/${month}`);
}

export async function getRawCalendar(daysAhead = 7): Promise<unknown[]> {
  const gc = await createClient();
  const today = new Date();
  const months = uniqueMonths(today, daysAhead);
  const results: unknown[] = [];

  for (const { year, month } of months) {
    const data = await fetchCalendarMonth(gc, year, month);
    results.push({ year, month, data });
  }
  return results;
}

export async function getUpcomingWorkouts(daysAhead?: number): Promise<GarminWorkout[]> {
  const days = daysAhead ?? Number(process.env.DAYS_AHEAD ?? 60);
  const gc = await createClient();
  const today = new Date();
  const end = addDays(today, days);
  const todayStr = format(today, 'yyyy-MM-dd');
  const endStr = format(end, 'yyyy-MM-dd');

  const months = uniqueMonths(today, days);
  const workouts: GarminWorkout[] = [];
  const seen = new Set<string>();
  // cache per evitare chiamate duplicate allo stesso workoutId
  const durationCache = new Map<string, number>();

  for (const { year, month } of months) {
    const data = await fetchCalendarMonth(gc, year, month);
    const items: any[] = data?.calendarItems ?? [];

    for (const item of items) {
      if (item.itemType !== 'workout') continue;
      if (!item.workoutId) continue;

      // il campo con la data è "date", non "startTimestampLocal" (che è null)
      const date: string | undefined = item.date;
      if (!date || date < todayStr || date > endStr) continue;

      const calItemId = String(item.id);
      if (seen.has(calItemId)) continue;
      seen.add(calItemId);

      const workoutId = String(item.workoutId);
      let durationSeconds = durationCache.get(workoutId);

      if (durationSeconds === undefined) {
        try {
          const detail = await gc.getWorkoutDetail({ workoutId });
          durationSeconds = detail.estimatedDurationInSecs ?? 3600;
        } catch {
          durationSeconds = 3600;
        }
        durationCache.set(workoutId, durationSeconds);
      }

      workouts.push({
        id: calItemId,
        workoutTemplateId: workoutId,
        title: item.title ?? 'Garmin Workout',
        date,
        durationSeconds,
      });
    }
  }

  return workouts.sort((a, b) => a.date.localeCompare(b.date));
}

function uniqueMonths(start: Date, daysAhead: number): { year: number; month: number }[] {
  const seen = new Set<string>();
  const result: { year: number; month: number }[] = [];

  for (let i = 0; i <= daysAhead; i++) {
    const d = addDays(start, i);
    const key = format(d, 'yyyy-M');
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }
  }
  return result;
}
