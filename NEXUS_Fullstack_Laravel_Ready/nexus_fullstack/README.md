# NEXUS — Full-stack Championship Edition

## Run immediately (no Composer needed)

**Requirements:** PHP 8.2+ with JSON support, and a modern browser. No database setup required for single-host use.

**Windows:** double-click `START_WINDOWS.bat`, then open http://127.0.0.1:8000.

**macOS/Linux:** `sh START_MAC_LINUX.sh`, then open http://127.0.0.1:8000.

Do **not** double-click `index.html`: a PHP web server is needed for the API.

The PHP server saves each game session as locked JSON inside `backend/data` and restores it when the browser refreshes. Local browser storage retains only the unpredictable session identifier. Opening the app in a different browser creates an independent championship.

## Optional Laravel 12 deployment

The `laravel/` folder contains a Laravel 12-compatible application scaffold and full API controller, routes, bootstrap and public assets, **but no vendor dependencies**. Laravel is NOT required for the standalone launch above.

1. Install PHP 8.2+ and Composer from their official sites.
2. From `laravel/` run `composer install`.
3. Copy `.env.example` to `.env` (`copy .env.example .env` on Windows).
4. Run `php artisan key:generate`.
5. Run `php artisan serve` and browse http://127.0.0.1:8000.

Both modes share `backend/src/GameStore.php` and `backend/data/`. Do not run both servers on port 8000 simultaneously. The Laravel API gets the `/api/` prefix through Laravel routing; the standalone server uses `backend/router.php`. No authentication accounts or database migrations are required for this single-device championship implementation. For public deployment add authentication and stronger rate limiting, HTTPS, and preferably a database.

## Functionality

- Two customizable teams and 2–6 players, with validation on both browser and server.
- Live team scores, restored from the backend after refresh.
- Football: manually confirmed goals/passes/missions; uncertain decisions are logged but never scored.
- Memory: answer-checked on server with one submission per question per team, per round.
- Tower building: range-checked measurement and human-witnessed stability data.
- Rhythm: interval-based score recalculated on server from submitted timing values.
- Final Protocol: unlock only after server verifies positive points from two different earlier trials; cannot award twice.
- JSON report export, evidence log and reset of round scores/events while retaining teams.
- Server-side scoring logic, timestamped events, locked writes, and a per-browser session token.

## API contract

`POST /api/sessions` creates a session.
`GET /api/sessions/{id}` retrieves a session.
`POST /api/sessions/{id}/setup` saves `{teams:{A:string,B:string},players:[{name,team}]}`.
`POST /api/sessions/{id}/events` records an action with `{game,description,team,player,details}`; scores always calculated server-side.
`POST /api/sessions/{id}/reset` starts a new round retaining the lineup.
Responses use `{ok:true,data:...}` or `{ok:false,error:...}`.

## Notes and current limitations

This is a working server-backed app, **not** automatic AI judging. It does not upload, analyze, or retain video, and football/tower evidence is human-confirmed. A local session URL ID functions as a bearer secret; do not expose the ID publicly. The PHP built-in server is intended for local development and demonstrations, not public hosting. Browser audio support varies, and timer progress is not maintained between refreshes.

## Tests actually performed

- PHP syntax checked across all backend/Laravel source files.
- JavaScript syntax checked with Node.
- Native PHP development server started and exercised via HTTP: session creation, session persistence, lineup validation, scoring, uncertainty, memory duplicate prevention, tower, rhythm, finale lock, and score reset.
- Laravel dependencies are not available in the packaging environment, so the Laravel runtime itself was **not** boot-tested; `composer install` is required before using it.
