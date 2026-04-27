import { DAVClient, DAVCalendar, DAVObject } from 'tsdav';

let _client: DAVClient | null = null;
let _calendar: DAVCalendar | null = null;

export async function getClient(): Promise<DAVClient> {
  if (_client) return _client;

  _client = new DAVClient({
    serverUrl: 'https://caldav.fastmail.com',
    credentials: {
      username: process.env.FASTMAIL_EMAIL!,
      password: process.env.FASTMAIL_APP_PASSWORD!,
    },
    authMethod: 'Basic',
    defaultAccountType: 'caldav',
  });

  await _client.login();
  return _client;
}

export async function getCalendar(): Promise<DAVCalendar> {
  if (_calendar) return _calendar;

  const client = await getClient();
  const calendars = await client.fetchCalendars();

  if (!calendars.length) throw new Error('Nessun calendario trovato su FastMail');

  const name = process.env.FASTMAIL_CALENDAR_NAME;
  if (name) {
    const match = calendars.find((c) => c.displayName === name);
    if (!match) {
      const names = calendars.map((c) => c.displayName ?? '(senza nome)').join(', ');
      throw new Error(`Calendario "${name}" non trovato. Disponibili: ${names}`);
    }
    _calendar = match;
  } else {
    _calendar = calendars[0];
    console.log(`Calendario usato: ${_calendar.displayName ?? _calendar.url}`);
  }

  return _calendar;
}

export async function createEvent(uid: string, ics: string): Promise<string> {
  const client = await getClient();
  const calendar = await getCalendar();
  const filename = `${uid}.ics`;

  await client.createCalendarObject({
    calendar,
    filename,
    iCalString: ics,
  });

  return `${calendar.url}${filename}`;
}

export async function fetchEvent(href: string): Promise<DAVObject | null> {
  const client = await getClient();
  const calendar = await getCalendar();

  const objects = await client.fetchCalendarObjects({
    calendar,
    objectUrls: [href],
  });

  return objects[0] ?? null;
}

export async function updateEvent(href: string, ics: string): Promise<void> {
  const client = await getClient();
  const existing = await fetchEvent(href);

  if (!existing) throw new Error(`Evento non trovato: ${href}`);

  await client.updateCalendarObject({
    calendarObject: {
      ...existing,
      data: ics,
    },
  });
}

export async function deleteEvent(href: string): Promise<void> {
  const client = await getClient();
  const existing = await fetchEvent(href);

  if (!existing) return; // già eliminato

  await client.deleteCalendarObject({ calendarObject: existing });
}

export async function listCalendars(): Promise<void> {
  const client = await getClient();
  const calendars = await client.fetchCalendars();
  console.log('Calendari disponibili:');
  calendars.forEach((c) => console.log(` - ${c.displayName ?? '(senza nome)'} → ${c.url}`));
}
