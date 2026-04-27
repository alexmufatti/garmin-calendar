# garmin-calendar

Script TypeScript per sincronizzare gli allenamenti pianificati su Garmin Connect nel calendario FastMail via CalDAV.

## Comandi

```bash
npm install
cp .env.example .env   # configura le credenziali

npm run fetch          # JSON grezzo da Garmin (debug)
npm run workouts       # allenamenti pianificati parsati
ts-node src/index.ts calendars   # elenca calendari FastMail
npm run sync           # sincronizzazione completa
```

## Logica di sync

- **Nuovo allenamento su Garmin** → crea evento alle `DEFAULT_TIME` (default 07:00)
- **Allenamento spostato di giorno su Garmin** → sposta evento preservando l'orario scelto dall'utente
- **Utente sposta evento nell'orario** → ignorato al prossimo sync (stessa data = nessun tocco)
- **Allenamento rimosso da Garmin** → elimina evento solo se `DELETE_REMOVED=true`

Lo stato (`garmin-calendar.state.json`) mappa `garminWorkoutId → { caldavHref, caldavUid, garminDate }`.

## FastMail App Password

Impostazioni FastMail → Sicurezza → App Passwords → Add → `garmin-calendar`.
Usa quella nel campo `FASTMAIL_APP_PASSWORD` nel `.env`.

## Note

- L'API Garmin Connect non è ufficiale (usa `garmin-connect` npm)
- I mesi nell'API Garmin sono 0-indexed (0=gennaio, 11=dicembre)
- Se `fetch` non restituisce workout, verifica la struttura `calendarItems` nel JSON grezzo
