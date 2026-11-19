# Sprint 2 change list (frontend)

Every file that changed, why, and which task it covers. Apply them in this order. Each step
is a good size for one commit or pull request.

## Step 1: Config and build fixes (D2)

| File | Change |
| --- | --- |
| `.env` (new) | `VITE_ROOT_API=http://localhost:3000` |
| `vite.config.js` | `require('path')` replaced with `fileURLToPath(new URL('./src', import.meta.url))`; `base: '/'` |
| `package.json` | `vite` and `@vitejs/plugin-vue` moved to devDependencies; Vue 2 `vuelidate` removed; `preview` script added |
| `index.html` | `lang="en"` |
| `public/_redirects` (new) | Netlify SPA fallback |
| `README.md` | Setup, build, preview, deployment, SPA fallback, CORS |

## Step 2: API layer and `useApi` (F2)

| File | Change |
| --- | --- |
| `src/api/api.js` | All the pass-through `try/catch` blocks and `throw error.response.data` removed. One response interceptor turns every failure into `new Error(message)` ("Unable to reach the server" when the backend is down). On a 401 (except the login request itself) it calls a handler registered from `main.js`. |
| `src/composables/useApi.js` (new) | `{ data, loading, error, execute }` |
| `src/utils/format.js` (new) | `formatDate` (was copied into 4 files) and `toMessage` (success toasts) |

Every `toast.error(error)` and `toast.error('text', error)` became `toast.error(error.message)`, so there's no more `[object Object]`.

## Step 3: Session restore and route guard (F4)

| File | Change |
| --- | --- |
| `src/store/loggedInUser.js` | `restoreSession()` reads `authToken`, decodes it with `jwt-decode`, and checks `exp`. A corrupted or expired token leads to `clearSession()`. Added an `isEditor` getter (allowlist), `clearSession()` (token + header + `$reset()`), and `handleUnauthorized()` for the interceptor. Login returns you to `?redirect=`. Logout goes to `/login`. |
| `src/main.js` | Installs Toast, calls `restoreSession()` **before** `app.use(router)`, and registers the 401 handler |
| `src/router/index.js` | `requiresEditor` on `/clientform`, `/eventform`, `/serviceform`. One guard handles both login and role checks. `/` now requires login. Catch-all route added. **Fixed the `eventdetails.vue` import, which pointed at the wrong case: the file is `eventDetails.vue`.** That import broke on Mac, Linux, and every host. |

## Step 4: DataTable (F3)

`src/components/DataTable.vue` (new) has these props: `columns` (`{ label, field, render? }`), `rows`, and an optional `emptyText`. It emits `row-click`.
- Clicking a header sorts ascending, then descending, then off.
- 10 rows per page with "Showing X–Y of Z".
- Shows a "No results" row when there's no data.
- Watching `rows` resets the table to page 1, so no stale rows are left after a search.
- Rows are keyboard-reachable (Tab and Enter).

## Step 5: List views (F1 + F2 + F3)

`findclient.vue`, `findevents.vue`, `findservice.vue`:
- Converted to `<script setup>`.
- Each uses `useApi(() => activeQuery ? searchX(activeQuery) : getX())`, so Retry repeats whatever failed.
- Each has three separate states: loading text, an error box with a Retry button, and DataTable (with its own empty message).
- Removed the undeclared `this.isLoading` from findevents.

## Step 6: Forms (F1)

`login.vue`, `serviceform.vue`, `clientform.vue`, `eventform.vue` were converted.
- Vuelidate is now `useVuelidate(rules, { client })` and `await v$.value.$validate()`.
- **Bug fixed:** the event description textarea had no `v-model`, so descriptions were never saved.

## Step 7: Detail views (F1 + S1/B1 frontend)

In `servicedetails.vue`, `eventDetails.vue`, and `clientdetails.vue`:
- `:disabled="user.role === 'viewer'"` became `:disabled="!user.isEditor"` (allowlist).
- `this.$router.back()` in templates became `router.back()`.
- **clientdetails:** `Promise.all` for registering was never awaited, so errors were lost. It's awaited now. It handles `{ message: 'Already registered' }` and `{ message: 'Not registered' }`. The "X" remove button is hidden for viewers.
- **eventDetails:** `attendees != 0` became `attendees?.length`.

## Step 8: Dashboard and charts (F1 + F2)

- **home.vue:** uses two `useApi` calls with loading, error + Retry, and empty states. **Bug fixed:** rows called an `editEvent()` method that didn't exist, which threw an error on click. Rows now open the event details.
- **barChart.vue / donutZipChart.vue:** `<script setup>`, with `watch` on props to update the chart, `chart.destroy()` in `onBeforeUnmount` (memory leak), and no `await new Chart`. Also fixed the Chart.js v4 option `gridLines`, which is now `grid`.

## Step 9: App.vue (F1)

- `<script setup>`
- The logo path changed from `@\assets\...` to `@/assets/...`, and alt text was added.
- Removed the broken `catch { throw (error) }` and the dead Vuex `logout()`.
- Nav uses `user.isEditor`.

## Test checklist before merging

- [ ] `npm run build` exits 0, and `npm run preview` works
- [ ] Refresh while logged in: still logged in with the same role
- [ ] Put `garbage` in localStorage `authToken` and refresh: you're cleanly logged out, with no crash
- [ ] Log in as `user` and type `/clientform`: you're redirected to `/`
- [ ] Logout clears `authToken` in DevTools → Application → Local Storage
- [ ] Stop the backend and open Find Client: the error box says "Unable to reach the server", and Retry works once the backend is restarted
- [ ] With 15+ rows, sort each column three ways, page through, search, and confirm you're back on page 1
- [ ] Refresh `/clientdetails/<id>` on the preview build
- [ ] Console shows no Vue warnings while clicking through every page