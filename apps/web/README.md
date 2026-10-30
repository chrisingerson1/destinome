# Destinome web

The destination details **Compare** button opens `/compare?destination=<slug>`
with that destination preloaded using the existing detail query cache. Refreshes
and shared URLs restore the source destination. The tab's last map URL is saved
in `sessionStorage`, including filters, pagination, camera position, and fragment.
Destination and comparison links do not include `returnTo`. Refreshing retains
the saved map view; a shared link uses the recipient's own saved map view, falling
back to `/map` when no map has been saved. Existing `returnTo` links import their
map settings into storage and remove the parameter without adding a history entry.
Opening `/compare` directly provides an entry point back to destination discovery.
The **Compare with** field reuses Globe's destination search. Focus it or open
its dropdown for suggestions, then type to search; the original destination is
excluded. Selecting a place loads its overall score and tier in the second
column. **Change** replaces it and **Remove** clears it. Both selections survive
refreshes, shared links, and Back/Forward using `/compare?destination=lisbon&with=porto`.
**Add category** opens a searchable list of categories scored for either selected
destination. Each selection adds a row with both scores and a colored score bar;
missing scores show **Unrated**. Remove a row with its × button. Overall stays in
the destination headers. Categories start empty and are saved in selection order
in a readable URL, for example
`/compare?destination=lisbon&with=porto&categories=food,budget`.
Refreshes, shared links, and Back/Forward restore these rows; changing or removing
the second destination keeps them. Map filters do not select comparison categories,
and weather is not added automatically.

Discovery settings live in the `/map` query string:

- `scores=food:8,nature:7`: every selected category must meet its minimum (0–10).
- `category=nature`: the category used to color pins; defaults to `overall`.
- `page=2`: the results page, reserved for the upcoming results panel; defaults to 1.
- `view=-71.05888,42.36008,10,30,45`: longitude, latitude, zoom, bearing, and pitch.

Score and camera separators stay readable, for example:
`/map?scores=overall:9.5,budget:8&category=budget&view=2.75971,47.01698,4.34,0,0`.
Older links with encoded commas and colons still work and are reformatted in
place without adding a browser history entry.

The existing score legend edits the selected category's minimum. Switching the
color category preserves other filters. Clear on an active-filter row removes
that category's minimum; Clear all removes every score filter. Missing scores never satisfy a
filter, including a minimum of zero.

Expand the **category filters active** summary to see each selected category and
its selected score tier and colored dot (for example, **Elite** in purple).
Each row has a **Clear** button that removes only that filter,
preserves the coloring category and other filters, and updates the map and
matching destinations immediately.

Expand the separate **Matching Destinations** box below the score legend to see
the remaining map destinations ranked by overall score, highest first. Without
filters, it lists all map destinations. Like the other controls, opening it
collapses the previously open panel. Missing
overall scores appear last, with name and ID breaking ties. The list scrolls
within the panel and loads 50 rows at a time using **Show more destinations**.
Click anywhere on a destination row to fly the map to its pin. Neighborhood rows
show their parent name.

Filter changes reset the results page. Filter and color changes create history
entries; camera movements replace the current entry. Back/Forward restores URL
settings without recreating the map. On destination, neighborhood, and comparison
pages, Back to map and Explore resume this tab's most recent map view.
If browser storage is blocked, return navigation still works in memory while
the app remains open; after a reload it falls back to `/map`.

Malformed URL values fall back to defaults; malformed score entries are ignored.
Duplicate category minimums use the highest threshold. Unrelated query parameters
are preserved when discovery settings change.

Run `npm test --workspace=@destinome/web` from the repository root (Node 22.18+
for native TypeScript test support). These tests cover URL parsing, updates,
matching rules, comparison links, stored map settings, and legacy-link migration;
they do not exercise WebGL rendering.

When the map fails to load, or the configured provider blocks requests with an
authorization or quota error, the globe shows **Map temporarily unavailable**
and hides its map controls. **Continue without Satellite Imagery** in satellite
mode (or **Continue without basemap** in OpenFreeMap mode) dismisses the alert and starts
a minimal globe using a local background style with no remote tiles, labels,
fonts, or sprites. The same destination pins, filters, search, and camera controls
remain available, with a small notice that satellite imagery is unavailable.
The current camera and discovery URL are preserved. This also works without a
MapTiler key. If the minimal map fails, **Try again** retries the minimal map
rather than contacting MapTiler. The fallback applies to the current map visit;
the shared navbar remains available throughout.

Manual smoke check with the API and web dev servers running:

1. Open `/map?scores=food:8,nature:7&category=nature&page=2&view=-71,42,8,30,40`.
2. Confirm the controls, pin filtering, and camera restore after refreshing.
3. Change color/filter settings, pan the map, then use Back/Forward to restore settings.
4. Open a pin's destination, refresh, visit a neighborhood, and use Back to map.
   Confirm the original filters, page, and camera return.

## MapTiler SDK migration and usage verification

The globe uses **`@maptiler/sdk` 4.2.0**, whose MapLibre core is **5.24.0**
(previously the app used MapLibre 6.14.0 directly). In production, `Globe.tsx` sets
`config.apiKey` from the existing `apps/web/.env.local` `VITE_MAPTILER_KEY` and
explicitly sets **`config.session = true`** before constructing the SDK `Map`.
The style shorthand `hybrid-v4` selects the same satellite style as before.
Style, source, tile, sprite, and glyph loading goes through the SDK's request
pipeline; MapTiler imagery is always loaded through the SDK `Map`. Development
defaults to OpenFreeMap, as described below. MapTiler documents the `mtsid`
parameter and session billing in
its [SDK configuration reference](https://docs.maptiler.com/sdk-js/api-reference/classes/SdkConfig/)
and [sessions versus requests guide](https://docs.maptiler.com/guides/account/sessions-vs-requests/).

The custom Three.js layer imports its coordinates and interfaces from the SDK.
Both core versions expose `defaultProjectionData.mainMatrix`,
`projectionTransition`, and `clippingPlane` with the same meanings; the 5.24
custom-layer matrices retain double precision for floating-origin transforms.
The layer types its map using the `onAdd` base interface, since the callback
does not promise SDK-specific methods. The projection calculations, shared
WebGL context, instancing, pin appearance, hit testing, and animation timing
are unchanged. Removal now explicitly disposes instanced-mesh buffers as well
as the existing geometry, materials, and renderer disposal.

The old public MapLibre 6 worker and shared module are removed. The SDK uses its
own core's bundled worker, avoiding a mismatched worker protocol. SDK navigation
and geolocation controls are disabled; the existing navigation control is added
once using the SDK's original MapLibre control export. Style label language,
responsive attribution behavior, camera settings, CSS, and popup layout are
preserved; SDK space and halo effects are disabled.

Initialization is deferred one timer tick so Strict Mode's cancelled first
effect creates no map or provider requests. Category, score, filter, and URL
changes keep the current map/layer. Unmount cancels pending startup and removes
the map. Constructor failures and a 20-second initial-load timeout show the
existing fallback prompt. Fatal provider failures dispose the map and abort
outstanding work, including the SDK's automatic style fallback; there is no
application retry loop. Continuing starts the existing local minimal globe
with the saved camera. A failed minimal attempt retries only that local style.

SDK telemetry is disabled to avoid metrics requests from fallback or removed
maps. SDK persistent caching is also disabled: in 4.2.0 its cache protocols do
not reject non-success HTTP responses with their status, which would hide late
authorization/quota failures from the fallback handler. Normal browser HTTP
caching remains enabled, matching the previous integration. This cache choice
does not disable sessions.

Development (`npm run dev --workspace=@destinome/web`) defaults to OpenFreeMap's
[Liberty vector basemap](https://openfreemap.org/quick_start/). No MapTiler key
is required, even when `VITE_MAPTILER_KEY` is absent. The existing globe projection,
Three.js pins, score filters, search, and camera controls use the same MapLibre
5.24 core, exported by the installed SDK as `MapMLGL`; no second mapping library
is installed. Both OpenFreeMap and local minimal maps use this base map class
so SDK metadata requests, metrics, and automatic MapTiler style fallback cannot
contact MapTiler. OpenFreeMap's source attribution remains visible through the
existing attribution control. Its tiles, fonts, and sprites are hosted by
OpenFreeMap; the style includes no MapTiler resources.

Optional development overrides (restart Vite after changing):

```sh
# Exercise production satellite imagery/session tracking with the configured key:
VITE_MAP_BASEMAP=maptiler npm run dev --workspace=@destinome/web

# Use the local globe without remote basemap traffic:
VITE_MAP_BASEMAP=minimal npm run dev --workspace=@destinome/web
```

Unset `VITE_MAP_BASEMAP` (or use `openfreemap`) to restore the development
default. Unknown values also select OpenFreeMap in development. Production
builds and `vite preview` always use session-enabled MapTiler Hybrid, regardless
of this variable. Keep `VITE_MAPTILER_KEY` configured for production builds.

Development smoke check: open `/map` with no MapTiler key and inspect Network.
Basemap style/source/tile/font/sprite requests should use `tiles.openfreemap.org`,
with no `api.maptiler.com` requests. Exercise pins, filters, search, and globe
zoom transitions; confirm OpenFreeMap/OpenMapTiles/OpenStreetMap attribution is
visible. Blocking OpenFreeMap should expose the local fallback action, whose
retry stays local.

Validation: web TypeScript/build, ESLint, and all 44 web tests
passed, as did the API typecheck. Tests exercise error classification, local
style independence, Strict Mode startup cancellation and cleanup, and the
installed SDK's real request transform, development defaults/overrides, and the
production provider guard. The request-transform check confirms style, tile, and
font URLs receive the same nonempty `mtsid` and API key while external URLs
are unchanged; it does not construct a WebGL map. A single live style probe
using this transform attached `mtsid` and returned **HTTP 403** with the
configured key. This confirms a provider access block, not its specific cause;
quota exhaustion was reported before the migration. Browser automation was
unavailable, so rendering, globe/Mercator transitions, all pins, popup hit
testing/navigation, recoloring/filter animations, neighborhood reveal, search
fly-to, control appearance, and fallback interaction remain browser smoke
checks. An OpenFreeMap Liberty style probe returned HTTP 200 and confirmed its
sources, fonts, and sprites point to OpenFreeMap without MapTiler dependencies;
this does not verify WebGL rendering. Actual session accounting cannot be confirmed until successful usage
is visible in the account. The build reports a large-chunk warning.

After provider access is restored:

1. Open `/map` in a production build/preview or with the `maptiler` development
   override above. In DevTools Network, filter for
   `api.maptiler.com`. Inspect the Hybrid style and uncached tile/glyph/sprite
   requests: they should include a nonempty `mtsid` that remains stable while
   panning and zooming on that page. The SDK can also make a source metadata
   request to determine logo requirements; not every ancillary SDK request is
   proof of billable map traffic. Avoid sharing URLs containing the API key.
2. Confirm the imagery, globe-to-Mercator transition, pins, hover previews,
   clicks/detail navigation, search fly-to, category colors, animated score
   filtering/counts, and neighborhood reveal above zoom 11. Verify there is
   one navigation control and one canvas, including in development Strict Mode.
   Changing scores or categories should not request another basemap style.
3. Block MapTiler requests in DevTools and reload to exercise the error prompt;
   also check a slow/unresponsive provider reaches the timeout. Continue without
   satellite imagery and repeat the pin/search/filter checks. The fallback must
   not make MapTiler requests, including when retrying a failed minimal map.
4. In [MapTiler Cloud Analytics](https://cloud.maptiler.com/analytics/), select
   the relevant API key/date range where available. Check the **map sessions**
   usage for a small controlled visit after analytics processing. Pan/zoom
   during that visit and confirm usage is attributed to sessions rather than
   independently billable tile requests. Historical request usage remains;
   SDK migration does not reset exhausted limits or change account settings.

## Vite template notes

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
