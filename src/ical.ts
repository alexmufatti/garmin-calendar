function stamp(): string {
  return new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
}

function toICalDate(date: string, time: string): string {
  // date: "2026-05-10", time: "07:00:00" → "20260510T070000"
  return date.replace(/-/g, '') + 'T' + time.replace(/:/g, '');
}

function addSeconds(time: string, seconds: number): string {
  const [h, m, s] = time.split(':').map(Number);
  const total = h * 3600 + m * 60 + s + seconds;
  const eh = Math.floor(total / 3600) % 24;
  const em = Math.floor((total % 3600) / 60);
  const es = total % 60;
  return [eh, em, es].map((v) => String(v).padStart(2, '0')).join(':');
}

export function generateICS(params: {
  uid: string;
  title: string;
  date: string;
  time: string;
  durationSeconds: number;
  garminId: string;
}): string {
  const { uid, title, date, time, durationSeconds, garminId } = params;
  const dtstart = toICalDate(date, time);
  const dtend = toICalDate(date, addSeconds(time, durationSeconds));

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//garmin-calendar//garmin-caldav-sync//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp()}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapeText(title)}`,
    `X-GARMIN-WORKOUT-ID:${garminId}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

// Estrae l'orario HH:MM:SS dal campo DTSTART di un iCS esistente
export function extractTimeFromICS(ics: string): string {
  const match = ics.match(/DTSTART[^:]*:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (!match) return process.env.DEFAULT_TIME ?? '07:00:00';
  return `${match[4]}:${match[5]}:${match[6]}`;
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}
