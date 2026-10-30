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

Manual smoke check with the API and web dev servers running:

1. Open `/map?scores=food:8,nature:7&category=nature&page=2&view=-71,42,8,30,40`.
2. Confirm the controls, pin filtering, and camera restore after refreshing.
3. Change color/filter settings, pan the map, then use Back/Forward to restore settings.
4. Open a pin's destination, refresh, visit a neighborhood, and use Back to map.
   Confirm the original filters, page, and camera return.

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
