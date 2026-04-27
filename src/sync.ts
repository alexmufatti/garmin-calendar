import { getUpcomingWorkouts } from './garmin';
import { createEvent, updateEvent, deleteEvent, fetchEvent } from './caldav';
import { loadState, saveState, getEntry, setEntry, removeEntry } from './state';
import { generateICS, extractTimeFromICS } from './ical';
import { GarminWorkout } from './types';

export async function resyncAll(): Promise<void> {
  const state = loadState();
  const workouts = await getUpcomingWorkouts();
  const extraSeconds = Number(process.env.EXTRA_MINUTES ?? 0) * 60;

  console.log(`\nForce-resyncing all events (${workouts.length} workouts)...`);

  for (const workout of workouts) {
    const entry = getEntry(state, workout.id);
    if (!entry) {
      await handleCreate(state, workout, process.env.DEFAULT_TIME ?? '07:00:00', extraSeconds);
    } else {
      await handleDateChange(state, workout, entry, extraSeconds);
    }
  }

  saveState(state);
  console.log('\nResync complete.');
}

export async function syncWorkouts(): Promise<void> {
  const state = loadState();
  const workouts = await getUpcomingWorkouts();
  const defaultTime = process.env.DEFAULT_TIME ?? '07:00:00';
  const extraSeconds = Number(process.env.EXTRA_MINUTES ?? 0) * 60;
  const deleteRemoved = process.env.DELETE_REMOVED === 'true';

  console.log(`\nWorkouts found on Garmin: ${workouts.length}`);

  const activeIds = new Set(workouts.map((w) => w.id));

  for (const workout of workouts) {
    const entry = getEntry(state, workout.id);

    if (!entry) {
      await handleCreate(state, workout, defaultTime, extraSeconds);
    } else if (entry.garminDate !== workout.date) {
      await handleDateChange(state, workout, entry, extraSeconds);
    } else {
      console.log(`  ✓ skip  ${workout.date}  ${workout.title}`);
    }
  }

  for (const [garminId, entry] of Object.entries(state)) {
    if (activeIds.has(garminId)) continue;

    if (deleteRemoved) {
      console.log(`  🗑  deleted  ${entry.garminDate}  (Garmin ID: ${garminId})`);
      await deleteEvent(entry.caldavHref).catch((e) =>
        console.warn(`    ↳ could not delete event: ${e.message}`)
      );
      removeEntry(state, garminId);
    }
  }

  saveState(state);
  console.log('\nSync complete.');
}

async function handleCreate(
  state: ReturnType<typeof loadState>,
  workout: GarminWorkout,
  defaultTime: string,
  extraSeconds: number
): Promise<void> {
  const uid = `garmin-cal-${workout.id}@garmin-caldav-sync`;
  const ics = generateICS({
    uid,
    title: workout.title,
    date: workout.date,
    time: defaultTime,
    durationSeconds: workout.durationSeconds + extraSeconds,
    garminId: workout.id,
  });

  try {
    const href = await createEvent(uid, ics);
    setEntry(state, workout.id, {
      caldavHref: href,
      caldavUid: uid,
      garminDate: workout.date,
    });
    console.log(`  ✅ created  ${workout.date}  ${workout.title}`);
  } catch (e: any) {
    console.error(`  ❌ error creating ${workout.title}: ${e.message}`);
  }
}

async function handleDateChange(
  state: ReturnType<typeof loadState>,
  workout: GarminWorkout,
  entry: ReturnType<typeof loadState>[string],
  extraSeconds: number
): Promise<void> {
  // Recupera l'evento esistente per preservare l'orario scelto dall'utente
  const existing = await fetchEvent(entry.caldavHref).catch(() => null);
  const currentTime = existing?.data ? extractTimeFromICS(existing.data) : (process.env.DEFAULT_TIME ?? '07:00:00');

  const ics = generateICS({
    uid: entry.caldavUid,
    title: workout.title,
    date: workout.date,
    time: currentTime,
    durationSeconds: workout.durationSeconds + extraSeconds,
    garminId: workout.id,
  });

  try {
    await updateEvent(entry.caldavHref, ics);
    setEntry(state, workout.id, {
      ...entry,
      garminDate: workout.date,
    });
    console.log(
      `  🔄 moved    ${entry.garminDate} → ${workout.date}  ${workout.title}  (time: ${currentTime})`
    );
  } catch (e: any) {
    console.error(`  ❌ error updating ${workout.title}: ${e.message}`);
  }
}
