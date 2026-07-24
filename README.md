# Kumpas: A Choir Operations Platform

Kumpas is a tool for choir officers to plan rehearsals, manage a song library, and (eventually) track attendance, membership, and music assets — replacing a patchwork of Google Sheets with a single purpose-built app.

This project is built in **slices** — each one a thin, shippable vertical cut through the whole stack (a bit of model, a bit of API, a bit of UI), rather than building one full layer at a time. Progress is tracked via git tags (`v0.1`, `v0.2`, ...) and the [Kumpas Implementation Framework](docs/) that drives development.

## Tech Stack

- **Backend**: FastAPI + SQLAlchemy + PostgreSQL, migrations via Alembic
- **Frontend**: React (Vite)
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

### Running Migrations

Whenever a model changes:
```
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```
Always review the generated migration file before applying it — autogenerate can produce unintended changes (e.g. dropping a table that simply isn't imported into `env.py` yet).

## API Reference

### `GET /appinfo`
Returns basic app metadata (name, version, status).

### Songs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/songs` | List all songs |
| `GET` | `/songs/{id}` | Get a single song |
| `POST` | `/songs` | Create a song |
| `PUT` | `/songs/{id}` | Update a song (any subset of fields) |
| `DELETE` | `/songs/{id}` | Delete a song |

**Song fields**: `title` (required), `composer_arranger` (optional), `notes` (optional)

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
| `DELETE` | `/rehearsal-plans/{id}` | Delete a plan (cascades to its items) |
| `POST` | `/rehearsal-plans/{id}/items` | Add a song block to a plan |
| `PUT` | `/rehearsal-plans/{id}/items/{item_id}` | Update an item's time/duration/order |
| `DELETE` | `/rehearsal-plans/{id}/items/{item_id}` | Remove a song block from a plan |

**Rehearsal Plan fields**: `date` (required, `YYYY-MM-DD`), `title` (optional), `notes` (optional)
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

## Roadmap

Kumpas is developed module by module. Current focus:

1. **Rehearsal Planning** ← in progress — song library, drag-and-drop rehearsal plan builder, export as image
2. Attendance
3. Membership Management
4. Music Library
5. Audition Management
6. Analytics Dashboard
7. Officer Portal
8. Member Portal

See the Implementation Framework doc for the full slice-by-slice breakdown of each module.
