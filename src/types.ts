export interface GarminWorkout {
  id: string;            // calItemId — ID univoco della singola istanza nel calendario
  workoutTemplateId: string; // workoutId — ID del template (uguale per workout ricorrenti)
  title: string;
  date: string;          // YYYY-MM-DD
  durationSeconds: number;
}

export interface StateEntry {
  caldavHref: string;   // path completo dell'evento sul server CalDAV
  caldavUid: string;    // UID dell'evento iCal
  garminDate: string;   // YYYY-MM-DD — ultima data nota da Garmin
}

// garminWorkoutId → entry
export type State = Record<string, StateEntry>;
