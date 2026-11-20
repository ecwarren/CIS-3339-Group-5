# Data Platform Project

Full-stack (MEVN) app for nonprofit organizations and their Community Health Workers:
clients, events, services, event registration and a dashboard.

- `backend/`: Node.js + Express REST API, MongoDB via mongoose
- `frontend/`: Vue 3 + Vite + Pinia + Tailwind single-page app

This iteration builds on work by earlier CIS 4339 students (Jeremy Griffith and Edwin Charly, Spring 2023;
Elliot Farmer Garcia, Agatha Molski and Chris Blanco, Fall 2022).

## Prerequisites

- Node.js **18 or newer** and npm
- A MongoDB database dedicated to this course project (MongoDB Atlas free tier works)

## Quick start (local)

```bash
# 1. backend
cd backend
npm install
npm run db:init        # organization, demo users, sample data
npm start              # API on http://localhost:3000

# 2. frontend (second terminal)
cd frontend
npm install
npm run dev            # http://localhost:5173
```

Log in with one of the demo accounts:

| Role | Username | Password | Can |
| --- | --- | --- | --- |
| Viewer | `user` | `user` | view everything, change nothing |
| Editor | `admin` | `admin` | create, edit, delete, register clients for events |

## Configuration (`.env` files)

Both `.env` files are **committed on purpose so the project can be graded**. They contain
course-project-only values (a dedicated database and secrets); rotate or disable them after grading.

**`backend/.env`**

| Variable | Purpose |
| --- | --- |
| `MONGO_URL` | Course-project MongoDB connection string |
| `PORT` | API port (`3000`) |
| `ORG_ID` | Organization this backend instance serves |
| `ORG_NAME` | Name used when `db:init` creates the organization |
| `JWT_SECRET` | Signs login tokens |
| `JWT_EXPIRES_IN` | Login lifetime (`8h`) |
| `CORS_ORIGIN` | Allowed frontend origin(s), comma-separated |
| `SEED_VIEWER_USERNAME` / `SEED_VIEWER_PASSWORD` | Viewer demo account (`user`/`user`) |
| `SEED_EDITOR_USERNAME` / `SEED_EDITOR_PASSWORD` | Editor demo account (`admin`/`admin`) |

**`frontend/.env`**

| Variable | Purpose |
| --- | --- |
| `VITE_ROOT_API` | URL of the backend API (`http://localhost:3000`). Baked in at build time. |

## Database initialization

```bash
cd backend
npm run db:init     # safe to repeat; never deletes data
npm run db:reset    # DESTRUCTIVE: deletes this org's clients/events/services, then reseeds
```

See `backend/README.md` for exactly what is created, including the **Isolation Test Org**
records used to demonstrate organization isolation.

## Production build

```bash
cd frontend
npm install
npm run build       # creates frontend/dist
npm run preview     # serves dist on http://localhost:4173 (npm run serve does the same)
```

The final demo runs against this production build, not `npm run dev`.

## Deployment

**Backend (e.g. Render web service)**
1. Root directory `backend`, build command `npm install`, start command `npm start`.
2. Add every variable from `backend/.env` as an environment variable. Set `CORS_ORIGIN` to the
   deployed frontend URL (no trailing slash), e.g. `https://your-site.netlify.app`.
3. In MongoDB Atlas -> Network Access, allow the host's outbound IPs (or `0.0.0.0/0` for the class project).
4. Run `npm run db:init` once against the database (locally with the same `MONGO_URL` is fine).
5. Check `https://<backend-url>/health` returns `{ "status": "ok", "db": "connected" }`.

**Frontend (e.g. Netlify)**
1. Base directory `frontend`, build command `npm run build`, publish directory `dist` (Netlify displays it as `frontend/dist`).
2. Environment variable `VITE_ROOT_API=https://<backend-url>` (Vite reads it at build time, so redeploy after changing it).
3. SPA fallback: `frontend/public/_redirects` contains `/*  /index.html  200`, so refreshing
   nested routes like `/clientdetails/<id>` works. Other static hosts need an equivalent
   "rewrite all paths to /index.html" rule.

## Security summary

- Every client, event and service route requires a valid JWT (`401` otherwise).
- Create, update, delete, register and deregister additionally require the `editor` role (`403` otherwise).
- Every query is scoped to the organization in the token by one helper, `withOrg`; other
  organizations' records return `404`.
- CORS only allows the origins in `CORS_ORIGIN`.
- Failed logins always say "Invalid username or password".
- All errors are returned as `{ "error": "..." }` with no stack traces. `GET /health` reports API and database status.

## Known limitations

- The JWT is stored in `localStorage` (readable by any script on the page); an httpOnly cookie would be safer.
- Client-side role checks are only for user experience; the backend enforces the real rules.
- Sorting and pagination happen in the browser, which is fine for hundreds of records but not for very large organizations.
- A client can belong to several organizations in the data model, but the UI only manages the current one.
- No automated test suite yet.
- The committed `.env` files contain real course-project credentials; they must be rotated after grading.
