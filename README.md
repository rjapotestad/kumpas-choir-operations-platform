# Kumpas: A Choir Operations Platform
![Default dashboard](docs/rehearsal-planner-demo.png)

Kumpas is a tool for choir officers to plan rehearsals, manage a song library, and (eventually) track attendance, membership, and music assets — replacing a patchwork of Google Sheets with a single purpose-built app.

**Live**: [kumpas-choir-operations-platform.vercel.app](https://kumpas-choir-operations-platform.vercel.app) (frontend) · [kumpas-6jw2.onrender.com](https://kumpas-6jw2.onrender.com) (backend API, docs at `/docs`)

> Backend runs on Render's free tier, which spins down after inactivity — the first request after a period of no traffic can take 30–60 seconds to respond while it wakes back up. Not a bug, just the free-tier tradeoff.

This project is built in **slices** — each one a thin, shippable vertical cut through the whole stack (a bit of model, a bit of API, a bit of UI), rather than building one full layer at a time. Progress is tracked via git tags (`v0.1`, ..., `v1.0-rehearsal-planning`) and the [Kumpas Implementation Framework](docs/) that drives development.

## Tech Stack

- **Backend**: FastAPI + SQLAlchemy + PostgreSQL, migrations via Alembic
- **Frontend**: React (Vite), drag-and-drop and sortable lists via [dnd-kit](https://docs.dndkit.com/)
- **Testing**: pytest + FastAPI's `TestClient`

## Project Structure

```
kumpas-choir-operations-platform/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, routes
│   │   ├── database.py      # engine, session, get_db dependency
│   │   └── models/          # SQLAlchemy models
│   ├── alembic/              # migration scripts
│   ├── tests/                 # pytest suite
│   └── .env                   # local secrets (not committed)
├── frontend/
│   └── src/
│       ├── components/       # React components
│       └── api/               # fetch wrappers for the backend API
├── docs/
└── tests/                      # reserved for frontend tests
```

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js (LTS)
- PostgreSQL running locally

### Backend Setup

1. Navigate to `backend/` and install dependencies:
   ```
   pip install -r requirements.txt
   ```
2. Create a `.env` file in `backend/` with:
   ```
   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/kumpas_db
   ```
   Optional (both have safe defaults, only needed for extra local control):
   ```
   CORS_ORIGINS=http://localhost:5173
   ACCESS_CODE=your-chosen-code
   ```
   `ACCESS_CODE` gates every data-modifying/reading route behind a shared secret (sent as an `X-Access-Code` header) — leave it unset for frictionless local dev; it's meant for the deployed/public version.
3. Create the database (if it doesn't exist yet):
   ```sql
   CREATE DATABASE kumpas_db;
   ```
4. Apply migrations:
   ```
   alembic upgrade head
   ```
5. Run the server:
   ```
   fastapi dev app/main.py
   ```
   API docs available at `http://localhost:8000/docs`.

### Frontend Setup

1. Navigate to `frontend/` and install dependencies:
   ```
   npm install
   ```
2. Run the dev server:
   ```
   npm run dev
   ```
   App available at `http://localhost:5173`.

### Running Tests

From `backend/`:
```
pytest
```

### Quick Start (Windows)

Once both setups above are done once, `start-kumpas.bat` (repo root) starts both servers and opens the app in your browser — just double-click it. Requires PostgreSQL to be running as a background service (default behavior after a standard install).

### Running Migrations

Whenever a model changes:
```
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```
Always review the generated migration file before applying it — autogenerate can produce unintended changes (e.g. dropping a table that simply isn't imported into `env.py` yet).

## Features

### Song Library
Manage the choir's active song list — add, edit, delete, search, and drag to reorder. Updates reflect instantly in the rehearsal plan builder below, no manual refresh needed (including live edits to a song's title/composer/notes, even while it's currently placed on the plan). Edit/Delete actions appear on hover to keep the list visually clean. A search box filters by title/composer as you type; the underlying order is preserved under the hood, so reordering still works correctly even while a search filter is active. The sidebar's height matches the rehearsal grid's rendered height exactly (measured, not guessed), and the song list scrolls internally once it's too long to fit — the page itself never grows past that. Deleting a song currently placed in a rehearsal plan is blocked with a clear message, rather than failing silently.

### Rehearsal Plan Builder
A visual, drag-and-drop replacement for planning rehearsals in a spreadsheet.

- **Editable date and time window**: the rehearsal date and a start/end time picker (12-hour, AM/PM) sit centered above the grid — change either and the grid regenerates its rows to match; persists immediately
- **Time grid**: dragging/resizing snaps to 5-minute increments, while the visible time labels only mark every 15 minutes, matching Google Calendar's own convention of sparse labels over a finer grid
- **Drag a song from the library onto a slot** to place it in the plan
- **Drag a placed block to a different slot** to move it; dropping onto an occupied slot replaces what's there
- **Resize** a placed block by dragging the thin handle at its bottom edge — stretches/shrinks in 5-minute increments, updating its duration live as you drag
- **Composer/arranger and notes** (if set on the song) display on its block beneath the title, centered and adapting as the block resizes
- **Remove** a block with the × button
- Everything persists to Postgres immediately — no separate "save" step, and the arrangement survives a page reload
- Currently works against a single active plan (auto-created on first load); a plan-picker for managing multiple rehearsal dates is a planned future addition

### Design
A dark, Calendar-inspired UI built on a four-color brand palette:

| Color | Hex | Role |
|---|---|---|
| Prussia | `#042a37` | Page/surface background, primary text (light-on-dark) |
| Vermilion | `#EE4004` | Primary interactive accent — buttons, focus states, resize handle |
| Olivine | `#53863b` | Default song-block color |
| Sunrise | `#F5E439` | Drag-over highlight only, used sparingly |

Song blocks cycle through a small palette derived from these four colors (each brand hue plus a tint), keyed to the block's own database ID so a song's color stays consistent across reloads. Typeface is Roboto for UI text and Roboto Mono for time labels, matching Google Calendar's own type system.

## API Reference

### `GET /appinfo`
Returns basic app metadata (name, version, status).

### Songs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/songs` | List all songs, ordered by `order_index` (falls back to `id` for unordered songs) |
| `GET` | `/songs/{id}` | Get a single song |
| `POST` | `/songs` | Create a song |
| `PUT` | `/songs/{id}` | Update a song (any subset of fields) |
| `DELETE` | `/songs/{id}` | Delete a song |

**Song fields**: `title` (required), `composer_arranger` (optional), `notes` (optional), `order_index` (optional, used for sidebar drag-reordering)

Example — create a song:
```json
POST /songs
{
  "title": "Ave Maria",
  "composer_arranger": "Franz Biebl",
  "notes": "double choir"
}
```

### Rehearsal Plans

A rehearsal plan is a date with an ordered set of time-boxed song blocks (items). Deleting a plan cascades and deletes its items too.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/rehearsal-plans` | List all plans (each includes its items) |
| `GET` | `/rehearsal-plans/{id}` | Get a single plan, including its items |
| `POST` | `/rehearsal-plans` | Create a plan |
| `PUT` | `/rehearsal-plans/{id}` | Update a plan's own fields (date/title/notes/start_time/end_time) |
| `DELETE` | `/rehearsal-plans/{id}` | Delete a plan (cascades to its items) |
| `POST` | `/rehearsal-plans/{id}/items` | Add a song block to a plan |
| `PUT` | `/rehearsal-plans/{id}/items/{item_id}` | Update an item's time/duration/order |
| `DELETE` | `/rehearsal-plans/{id}/items/{item_id}` | Remove a song block from a plan |

**Rehearsal Plan fields**: `date` (required, `YYYY-MM-DD`), `title` (optional), `notes` (optional), `start_time`/`end_time` (optional, `HH:MM` 24-hour, default `17:30`/`20:00` — defines the grid's window; the frontend displays these in 12-hour AM/PM but always sends 24-hour)
**Rehearsal Plan Item fields**: `song_id` (required, must reference an existing song), `start_time` (optional, e.g. `"18:30"`), `duration_minutes` (optional), `order_index` (required)

Example — create a plan, then add a song to it:
```json
POST /rehearsal-plans
{
  "date": "2026-08-01",
  "title": "August Kickoff"
}
```
```json
POST /rehearsal-plans/1/items
{
  "song_id": 3,
  "start_time": "18:00",
  "duration_minutes": 15,
  "order_index": 0
}
```

### Members

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/members` | List members, ordered by name. Filterable via `?section=` and/or `?status=` query params |
| `GET` | `/members/{id}` | Get a single member |
| `POST` | `/members` | Create a member |
| `PUT` | `/members/{id}` | Update a member (any subset of fields) |
| `DELETE` | `/members/{id}` | Delete a member |

**Member fields**: `name` (required), `email` (optional), `status` (enum: `Active`/`Inactive`/`Probationary`/`Trainee`, defaults to `Active`), `section` (required, enum: `Soprano`/`Alto`/`Tenor`/`Bass`), `subsection` (optional, `1` or `2` — combine with section for display as S1/S2/A1/A2/T1/T2/B1/B2), `remarks` (optional)

Example — create a member:
```json
POST /members
{
  "name": "Juan Dela Cruz",
  "email": "juan@example.com",
  "status": "Active",
  "section": "Soprano",
  "subsection": 1,
  "remarks": "Section leader"
}
```

## Roadmap

Kumpas is developed module by module. Current focus:

1. **Rehearsal Planning** — done, live (`v1.0-rehearsal-planning`) — song library, drag-and-drop rehearsal plan builder
2. **Membership & Attendance** ← in progress — member directory (done), rehearsal attendance checker, analytics dashboard
3. Seat Plan
4. Music Library
5. Audition Management
6. Officer Portal
7. Member Portal

See the Implementation Framework doc for the full slice-by-slice breakdown of each module.
