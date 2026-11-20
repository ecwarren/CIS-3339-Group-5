# Sprint 3 change list (backend)

What changed, why, and which task it covers. Each step is one commit.

## 1. Config (D1/D2)
- `backend/.env`: all required variables (`MONGO_URL`, `PORT`, `ORG_ID`, `ORG_NAME`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, seed accounts).
- `backend/package.json`: `npm start` now runs `node app.js`, because `nodemon` was never installed. `npm run dev` uses nodemon, which is now a devDependency. Requires Node 18 or newer.
- Root `.gitignore`: keeps `node_modules` and `dist` out of the repo. `.env` files stay committed for grading.

## 2. Error handling, health check, CORS (B2 + S1)
- `app.js`: one error handler, registered after all routes. It always returns `{ error }`:
  - `400` for a validation error, an invalid id, or bad JSON
  - `404` for not found
  - `409` for a conflict
  - `500` for anything else, with no stack trace or Mongo details
- Unknown routes return `404 { error: 'Not found' }`.
- Added `GET /health` (public).
- CORS only allows `CORS_ORIGIN` (was `*`).
- The server refuses to start without `MONGO_URL`, `ORG_ID`, or `JWT_SECRET`.
- `app.listen` moved to the end, and `app` is exported so it can be tested.

## 3. Auth middleware and the org helper (S1)
- `auth/authMiddleWare.js`: `requireAuth` (401) and `requireRole(role)` (403). Tokens without `orgId` are rejected.
- `utils/withOrg.js`: the one helper that adds `req.user.orgId` to queries.
- `utils/http.js`:
  - `httpError` creates errors that carry a status code.
  - `asyncHandler` sends errors from async routes to the error handler.
  - `escapeRegex` makes search text match literally instead of as a pattern.
  - `stripProtectedFields` removes `_id`, `org`, `orgs`, and `$` operators from request bodies.
- `routes/users.js`:
  - The JWT now includes `orgId` and `id`.
  - Every failed login returns `401 "Invalid username or password"`. It used to say "Invalid username" when the username didn't exist.
  - Non-string usernames and passwords are rejected.
  - Tokens last 8h, down from 30 days.
- `routes/org.js`: converted to async. Returns `404` instead of `400`.

## 4–6. Securing the routes (S1, B1)
Every client, event, and service route now has `requireAuth`, plus `requireRole('editor')` on anything that changes data, and runs every query through `withOrg`. Bugs fixed along the way:

| Before | Problem |
| --- | --- |
| `GET /clients` used `clients.find({})` | returned **every organization's** clients |
| `GET /clients/byzip`, `GET /events/attendance` | no login required; byzip counted all organizations |
| `PUT /clients/update/:id`, `PUT /services/update/:id` used `findByIdAndUpdate` | could edit another organization's record by id |
| `GET /events/attendees/:id` used `findById` | could list another organization's attendees |
| `PUT /events/deregister` | no org check; also `$pull`ed from a `client.events` field that doesn't exist |
| `PUT /events/register` used `$push` after a separate check | could create duplicates; returned 400 for an already-registered client |
| create routes trusted `req.body` | a body could set `org`/`orgs`, or use `$push` to move a record to another org |
| searches put raw text into regexes | `.*(` etc. could break or slow queries |
| not found returned `400` | changed to `404` |
| delete blocked by attendees returned `406`/`400` | changed to `409` |

**B1:**
- **register** returns the updated event, or `200 { message: 'Already registered' }`. It uses one atomic `$addToSet` update, so there can never be a duplicate.
- **deregister** returns the updated event, or `200 { message: 'Not registered' }`.
- Both return `404` unless the event and the client both belong to the user's organization.

Events can only be linked to services from the same organization. Attendees can only be changed through register/deregister.

## 7. Models (D1, data integrity)
- `users`:
  - `_id` is generated automatically.
  - `role` must be `viewer` or `editor`.
  - `org` is required.
  - Usernames must be unique within an organization (unique index).
- `services`: `status` must be `Active` or `Inactive` (defaults to `Active`), and `org` is required.
- Added indexes on the organization field for clients, events, and services.

## 8. Database initialization (D1)
- `scripts/dbInit.js` (`npm run db:init`):
  - Checks `.env` first and exits with code 1 and a clear message if anything is wrong.
  - Creates the indexes.
  - Creates anything missing, so running it twice gives the same result: the org, `user`/`user` (viewer), `admin`/`admin` (editor), 16 services, 16 clients, and 16 events with registrations. Passwords are hashed with bcrypt.
  - Creates the **Isolation Test Org** at fixed ids for the isolation demo.
  - Prints a summary.
- `npm run db:reset` (`--reset`) is the only destructive option. It deletes this org's clients, events, and services, then seeds again.
- `scripts/seedData.js`: the sample data.
- Removed `create_hash.js`.

## 9. Docs (D2)
- Root `README.md`: prerequisites, setup, `.env` variables, db init, build, deployment (Render + Netlify), SPA fallback, CORS, demo users, known limitations.
- `backend/README.md`: backend details, security rules, error shape, and PowerShell commands for testing 401/403/404.

## Demo video checklist (Sprint 3)
- [ ] `npm run db:init` on an empty database (then run it again to show there are no duplicates)
- [ ] Log in as `user` (viewer) and as `admin` (editor)
- [ ] Viewer is denied: the buttons are disabled in the UI, **and** a `POST /clients` in Postman with the viewer token returns `403`
- [ ] Organization isolation: `GET /clients/id/650000000000000000000002` with your token returns `404`
- [ ] Client, event, and service workflows: create, edit, delete, register, and deregister (register twice to show "Already registered")
- [ ] `npm run build`, then the app running from `npm run preview` or the deployed site
