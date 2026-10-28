# Data Platform Frontend

Vue 3 + Vite + Tailwind CSS + Pinia. Form validation uses [Vuelidate](https://vuelidate-next.netlify.app/).
All components use the Composition API (`<script setup>`).

## Prerequisites

- Node.js 18 LTS or newer (tested target: Node 18/20)
- A running backend (see `../backend/README.md`)

## Configuration

The committed `.env` file in this folder holds:

| Variable | Purpose |
| --- | --- |
| `VITE_ROOT_API` | Base URL of the backend API, e.g. `http://localhost:3000` |

Vite bakes this value into the build at **build time**. To point a production build at a
different backend, change `VITE_ROOT_API` (or set it as an environment variable on your host)
and run `npm run build` again.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
```

## Production build

```bash
npm install
npm run build      # outputs frontend/dist
npm run preview    # serves dist/ locally (npm run serve does the same)
```

The final demo should run against `npm run preview` (or the deployed site), not `npm run dev`.

## Deployment (static host)

`dist/` is a static single-page app. Every unknown path must fall back to `index.html`,
otherwise refreshing a nested route such as `/clientdetails/123` returns a 404.

- **Netlify:** `public/_redirects` (already included) contains `/*  /index.html  200`.
  Build command `npm run build`, publish directory `dist`, base directory `frontend`.
- **Other hosts:** add an equivalent rewrite rule (all paths -> `/index.html`).

The backend's `CORS_ORIGIN` must equal the frontend's deployed origin
(e.g. `https://your-site.netlify.app`, or `http://localhost:4173` for `npm run preview`).

## Project structure

```text
src/api/api.js              Axios client + the single response interceptor (error messages, 401 handling)
src/composables/useApi.js   { data, loading, error, execute } for list views and dashboard
src/components/DataTable.vue Reusable sortable, paginated table
src/store/loggedInUser.js   Pinia session store (login, logout, restoreSession)
src/router/index.js         Routes; one guard for requiresAuth / requiresEditor
src/utils/format.js         formatDate and toast message helpers
```

## Demo accounts

| Role | Username | Password |
| --- | --- | --- |
| Viewer | `user` | `user` |
| Editor | `admin` | `admin` |
