# Backend

Express + MongoDB ([mongoose](https://mongoosejs.com/)) REST API for the Data Platform.

## Prerequisites

- Node.js 18 or newer
- A MongoDB database for this course project (MongoDB Atlas free tier works)

## Setup

```bash
cd backend
npm install
npm run db:init     # creates the organization, demo users and sample data
npm start           # http://localhost:3000   (npm run dev restarts on file changes)
```

## Configuration: `backend/.env`

This file is committed **only so the project can be graded**. It must contain course-project
values only: no personal or production credentials. Rotate or disable them after grading.

| Variable | Purpose |
| --- | --- |
| `MONGO_URL` | MongoDB connection string for the course-project database |
| `PORT` | Port the API listens on (default `3000`) |
| `ORG_ID` | 24-character ObjectId of the organization this instance serves. Login only accepts users of this org. |
| `ORG_NAME` | Organization name used by `db:init` when it creates the org (optional) |
| `JWT_SECRET` | Secret used to sign and verify login tokens |
| `JWT_EXPIRES_IN` | How long a login lasts, e.g. `8h` (optional, default `8h`) |
| `CORS_ORIGIN` | Frontend origin(s) allowed to call the API. Comma-separated, e.g. `http://localhost:5173,http://localhost:4173` (dev server + `npm run preview`). In production, set it to the deployed frontend URL. |
| `SEED_VIEWER_USERNAME` / `SEED_VIEWER_PASSWORD` | Viewer demo account created by `db:init` (`user` / `user`) |
| `SEED_EDITOR_USERNAME` / `SEED_EDITOR_PASSWORD` | Editor demo account created by `db:init` (`admin` / `admin`) |

The server refuses to start if `MONGO_URL`, `ORG_ID` or `JWT_SECRET` is missing.

## Database initialization

```bash
npm run db:init
```

- Checks `.env` first and exits with a non-zero code and a clear message if something is missing or invalid.
- Creates (only if missing) the organization `ORG_ID`, the two demo accounts with **bcrypt-hashed**
  passwords, 16 services, 16 clients and 16 events including sample registrations, plus the indexes
  the API relies on (unique `username` per organization).
- Creates a separate **Isolation Test Org** with one client, event and service at fixed ids
  (printed at the end) to demonstrate that other organizations' data is never visible.
- Safe to run again: it never creates duplicates and never deletes data. If the demo account
  passwords in `.env` change, it updates their hashes.

```bash
npm run db:reset
```

**Destructive.** Deletes all clients, events and services of `ORG_ID` and the test org, then seeds
again. Users and organizations are kept. Use only when you want a clean demo database.

## Demo accounts

| Role | Username | Password |
| --- | --- | --- |
| Viewer | `user` | `user` |
| Editor | `admin` | `admin` |

## Security rules

| Operation | Requires |
| --- | --- |
| Read clients, events, services, dashboard data | `requireAuth` (valid JWT) -> otherwise `401` |
| Create, update, delete, register, deregister | `requireAuth` + `requireRole('editor')` -> otherwise `403` |
| `GET /health`, `GET /org`, `POST /users/login` | public |

- `auth/authMiddleWare.js` exports `requireAuth` and `requireRole(role)`.
- `utils/withOrg.js` adds the organization from the token (`req.user.orgId`) to **every** query.
  The organization never comes from the request body or URL, and update bodies cannot change
  `org`/`orgs`/`_id`. A record from another organization behaves exactly like a missing record: `404`.
- Failed logins always return `401 { "error": "Invalid username or password" }`.

## Errors and health check

Every error response has the same shape:

```json
{ "error": "Human readable message" }
```

`400` validation/invalid id, `401` not logged in, `403` not allowed, `404` not found,
`409` conflict (e.g. deleting an event that has attendees), `500` unexpected error.
Stack traces and database errors are only written to the server log.

`GET /health` -> `{ "status": "ok", "db": "connected" }` (or `"disconnected"` with status `503`).

## Event registration

| Endpoint | Result |
| --- | --- |
| `PUT /events/register?event=<id>&client=<id>` | `200` updated event, or `200 { "message": "Already registered" }` |
| `PUT /events/deregister?event=<id>&client=<id>` | `200` updated event, or `200 { "message": "Not registered" }` |

Both return `404` if the event or client does not exist in the user's organization.

## Checking the rules by hand (PowerShell)

```powershell
$api = "http://localhost:3000"
$viewer = (Invoke-RestMethod -Method Post "$api/users/login" -ContentType "application/json" -Body '{"username":"user","password":"user"}').token
$editor = (Invoke-RestMethod -Method Post "$api/users/login" -ContentType "application/json" -Body '{"username":"admin","password":"admin"}').token
$body = '{"firstName":"Test","lastName":"Person","phoneNumber":{"primary":"7135550199"},"address":{"city":"Houston"}}'

# 401: no token
Invoke-RestMethod "$api/clients"
# 403: viewer tries to create
Invoke-RestMethod -Method Post "$api/clients" -Headers @{Authorization="Bearer $viewer"} -ContentType "application/json" -Body $body
# 201: editor creates
Invoke-RestMethod -Method Post "$api/clients" -Headers @{Authorization="Bearer $editor"} -ContentType "application/json" -Body $body
# 404: record from the Isolation Test Org
Invoke-RestMethod "$api/clients/id/650000000000000000000002" -Headers @{Authorization="Bearer $editor"}
Invoke-RestMethod -Method Put "$api/clients/update/650000000000000000000002" -Headers @{Authorization="Bearer $editor"} -ContentType "application/json" -Body $body
# health
Invoke-RestMethod "$api/health"
```

PowerShell shows a red error for the 4xx responses; the status code and the `{ "error": ... }`
message are in that output. Postman shows the same thing more clearly.
