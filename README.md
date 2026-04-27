# garmin-calendar

Syncs planned workouts from Garmin Connect to a FastMail calendar via CalDAV.

## How it works

- Reads upcoming scheduled workouts from Garmin Connect
- Creates calendar events at a configurable default time (e.g. 07:00)
- Adds configurable extra time for changing and showering
- On subsequent runs, only updates events whose **date** changed in Garmin — if you move an event to a different time slot in your calendar, that change is preserved
- If a workout moves to a different **day** in Garmin, the event is rescheduled while keeping the time you set

## Requirements

- Node.js 18+
- A FastMail account with CalDAV access
- A Garmin Connect account

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` with your credentials:

```env
GARMIN_EMAIL=you@example.com
GARMIN_PASSWORD=yourpassword

FASTMAIL_EMAIL=you@fastmail.com
FASTMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx

FASTMAIL_CALENDAR_NAME=        # leave empty to use the first calendar found
DEFAULT_TIME=07:00:00          # default start time for new events
EXTRA_MINUTES=30               # extra time added for changing + shower
DAYS_AHEAD=60                  # how many days ahead to sync
DELETE_REMOVED=false           # delete events when removed from Garmin
```

**FastMail App Password**: go to Settings → Security → App Passwords → Add, create a password named `garmin-calendar`. Use that value for `FASTMAIL_APP_PASSWORD` — do not use your main FastMail password.

## Usage

```bash
npm run sync       # normal sync — only processes what changed
npm run resync     # force-update all events (use after changing EXTRA_MINUTES or fixing durations)
```

## Recommended workflow

Set up a daily cron job to run sync automatically:

```bash
crontab -e
```

```
0 6 * * * cd /path/to/garmin-calendar && npm run sync >> /tmp/garmin-calendar.log 2>&1
```

Or run `npm run sync` manually whenever you update your training plan in Garmin.

## Debug commands

```bash
npm run fetch        # print raw JSON from Garmin calendar API
npm run workouts     # print parsed upcoming workouts
npm run durations    # show Garmin duration vs total event duration for each workout
npm run calendars    # list available FastMail calendars
npx ts-node src/index.ts detail <workoutTemplateId>   # inspect raw workout detail
```

## Sync rules

| Situation | Behaviour |
|-----------|-----------|
| New workout added in Garmin | Creates event at `DEFAULT_TIME` |
| Workout moved to a different **day** in Garmin | Updates event date, preserves your chosen time |
| You move an event to a different **time** in your calendar | Ignored on next sync |
| Workout removed from Garmin | Ignored (or deleted if `DELETE_REMOVED=true`) |

## State file

The file `garmin-calendar.state.json` is created automatically and maps each Garmin calendar item to its CalDAV event. Do not edit it manually. It is gitignored.
