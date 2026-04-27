# garmin-calendar

Syncs planned workouts from Garmin Connect to any CalDAV calendar (FastMail, Nextcloud, iCloud, Proton Calendar, and more).

## How it works

- Reads upcoming scheduled workouts from Garmin Connect
- Creates calendar events at a configurable default time (e.g. 07:00)
- Adds configurable extra time for changing and showering
- On subsequent runs, only updates events whose **date** changed in Garmin — if you move an event to a different time slot in your calendar, that change is preserved
- If a workout moves to a different **day** in Garmin, the event is rescheduled while keeping the time you set

## Requirements

- Node.js 18+
- A Garmin Connect account
- Any CalDAV-compatible calendar server

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` with your credentials:

```env
GARMIN_EMAIL=you@example.com
GARMIN_PASSWORD=yourpassword

# CalDAV server URL — examples:
# FastMail:  https://caldav.fastmail.com
# Nextcloud: https://nextcloud.example.com/remote.php/dav
# iCloud:    https://caldav.icloud.com
# Proton:    https://calendar.proton.me/dav
CALDAV_URL=https://caldav.fastmail.com

CALDAV_USERNAME=you@example.com
CALDAV_PASSWORD=your-app-password

CALDAV_CALENDAR_NAME=        # leave empty to use the first calendar found
DEFAULT_TIME=07:00:00        # default start time for new events
EXTRA_MINUTES=30             # extra time added for changing + shower
DAYS_AHEAD=60                # how many days ahead to sync
DELETE_REMOVED=false         # delete events when removed from Garmin
```

> **Tip — use an app password**: most CalDAV providers support app-specific passwords that can be revoked without changing your main password. For FastMail: Settings → Security → App Passwords. For Nextcloud: Settings → Security → Devices & Sessions.

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
npm run calendars    # list available CalDAV calendars
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

> **First run on an existing calendar**: the tool only manages events it has created itself and never touches anything else in your calendar. However, on the first run it creates new events for all upcoming Garmin workouts without checking for existing ones — if you've already added those workouts manually, you'll get duplicates. Remove the manual entries before running `sync` for the first time.

## Notes

- Garmin Connect has no official public API — this project uses the [`garmin-connect`](https://github.com/Pythe1337N/garmin-connect) npm package, which may break if Garmin changes their API
- Months in the Garmin calendar API are 0-indexed (0 = January, 11 = December) — handled internally
