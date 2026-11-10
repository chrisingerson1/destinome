# Destinome

This npm monorepo contains the Vite frontend (`apps/web`), Fastify API
(`apps/api`), and shared PostgreSQL/Drizzle package (`packages/database`).

## Database environments

Ordinary development keeps using Docker PostgreSQL and the existing workspace
`.env` files. The separate, ignored root `.env.local` holds Neon credentials:

- `DATABASE_URL`: pooled connection for API queries.
- `DATABASE_URL_UNPOOLED`: direct connection for Drizzle migrations.

Run the API against Neon explicitly:

```sh
npm run dev:neon --workspace=@destinome/api
# Without file watching:
npm run start:neon --workspace=@destinome/api
```

These commands load the root `.env.local` rather than the local workspace
database credentials. The existing `dev` and `start` commands keep their local
behavior. On Vercel, configure `DATABASE_URL` in the API project's server-side
environment; its reusable pool is registered with Vercel's suspension lifecycle.
Never put database credentials in frontend `VITE_*` variables.

Neon is configured in `neon.ts` for Postgres only. Refresh credentials without
overwriting the local `.env`:

```sh
neon deploy --no-env-pull
neon env pull --file .env.local --service postgres
```

Migrations are separate from credential setup and use the direct connection:

```sh
npm run db:migrate:neon --workspace=@destinome/database
```

The linked Neon branch is `production`; migration and import commands change
that online database. Do not run them as part of a routine frontend/API build.
Running `neon deploy` configures Neon services, not the application's SQL schema
or destination dataset. Rehearse migrations on a separate Neon branch before
applying them to production.

## Vercel setup

Use separate projects for `apps/api` (Fastify) and `apps/web` (Vite), keeping the
repository's npm workspace installation and shared database package available
to both projects. Node 26 is pinned to match the tested local runtime. The API
uses Vercel's `iad1` region, close to the Neon database in AWS US East.

Set the pooled `DATABASE_URL` only in the API project's server-side environment.
Keep the direct migration URL out of the frontend project. `.vercelignore`
excludes local environment files, database backups, CSV files, and local build
artifacts from CLI uploads.

The web project uses `APP_BASE_PATH=/destinome/` for the temporary demo and
its browser-visible MapTiler key. Its same-origin API proxy and scoped SPA
routing are configured in `apps/web/vercel.json`. Keep domain forwarding
and DNS unchanged until the remaining public-launch checks are complete.

### Git release workflow

Both Vercel projects are connected to the same GitHub monorepo,
`chrisingerson1/destinome`, with `main` as their production branch:

| Project | Root directory | Production branch |
| --- | --- | --- |
| `destinome-web` | `apps/web` | `main` |
| `destinome-api` | `apps/api` | `main` |

Both projects include files outside their root directory so npm workspace
dependencies in `packages/` remain available. Their existing install and
build commands are defined in each app's `vercel.json`.

Production releases come from commits pushed or merged to GitHub `main`.
Local edits and local commits alone do not update production. Use `develop`
for ongoing development once that branch is created; merge tested changes
to `main` when ready to release. No branch changes or commits were made as
part of connecting Git. The first actual push will verify the Git webhook
end to end; connecting the repositories did not change either live deployment.

Non-production branches use Vercel preview deployments. Preview credentials
are a separate setup; do not copy production database credentials into previews.
GitHub deployment notifications are disabled independently of Vercel builds.

### API project prepared

The Vercel project is `destinome/destinome-api`, rooted at `apps/api`, with
shared workspace files included, Node 26, Fluid compute, and region `iad1`.
The checkout is linked to this API project through the ignored `.vercel/`
directory. Check the linked project before future CLI deployments, especially
after adding the separate web project.

Its production-only `DATABASE_URL` is stored as a sensitive variable and uses
the pooled Neon login `destinome_api_reader`. This login can read the `public`
tables but cannot write data or create tables. Local development and migrations
retain their existing credentials. An ignored recovery copy of the API login
is kept in `.vercel/.env.api.production.local`; do not upload or commit it.
Preview deployments do not have database credentials configured yet.

At the initial setup, both projects required Vercel authentication and the
team used Hobby. The frontend custom domain has since been connected and is
public at <https://chrisingerson.com/destinome/>. Check the current hosting
plan's commercial-use terms before a business launch.

### API build and first deployment

The protected API is deployed at <https://destinome-api.vercel.app>.
The first verified deployment (November 10, 2026) is
<https://destinome-ppw8i0ihj-destinome.vercel.app>, ID
`dpl_CoZGAD1UJMFwihnN5MF9zTb32oHi`. This was a CLI deployment of the working
tree, including uncommitted deployment preparation, based on commit `f7ff51a`.
Git integration was connected afterward; see the Git release workflow above.

Vercel installs from the monorepo root with `npm ci --include=optional`, then
runs the API's `build` script to compile the shared database package. Its
default runtime export points to `dist/index.js`. Existing API development,
start, and test commands select the `development` export, which keeps using
`src/index.ts` without a separate database build. Restart an already-running
local API once after these script changes. Migrations and data imports are
never part of the production build.

The root lockfile includes TypeScript's platform-specific compiler packages
for Linux as well as macOS. Explicit type roots let Vercel's temporary compiler
configuration find Node types. Keep the root lockfile authoritative; the
workspace lockfiles are legacy files.

Verification passed: API TypeScript checks and 32 tests; clean dependency
installation; development/source and production/JavaScript module resolution;
online health, database, list, search, detail, map, and score requests; expected
400/404 responses; and anonymous access blocked on both deployment URLs.
The online list reports 6,540 destinations.
The post-test runtime scan found no startup failures. The driver's existing
`sslmode=require` setting produced a TLS compatibility warning on stderr;
the installed driver currently treats it as `verify-full`. Set the deployment
connection's SSL mode explicitly to `verify-full` when next updating that
secret, before a future driver major-version upgrade.

For a later failed release, restore this verified deployment with:

```sh
vercel rollback https://destinome-ppw8i0ihj-destinome.vercel.app --scope destinome
```

Check the deployment target and sign-in protection before changing aliases.
Rollback switches application code; it does not undo database migrations.
This deployment made no schema or data changes.

### Protected frontend deployment

The frontend project is `destinome/destinome-web`, rooted at `apps/web`:
<https://destinome-web.vercel.app/destinome/>. Its first verified deployment
(November 10, 2026) is <https://destinome-2zsgejoqy-destinome.vercel.app/destinome/>,
ID `dpl_LSC5nhZMgEw9SSJXSqf29dcndjWG`. Both projects required Vercel sign-in
at that point. Git integration and the public custom domain were connected
afterward.

Normal production releases use Git `main`. For an explicitly authorized manual
recovery deployment, use project IDs from the repository root to avoid deploying
to the wrong workspace; the existing local CLI link still points to the API:

```sh
vercel deploy --prod --project prj_ApedyZCOwrCFAbh6TKnqxntFjdVj --scope destinome
vercel deploy --prod --project prj_pDJCMsnJ255inuJhjVFH0iKOGKZD --scope destinome
```

The frontend installs from the root lockfile. During Vercel builds only,
Vite places output under `dist/destinome/` so all public assets share the app's
mount point. Regular local development and builds retain their previous paths.
The hosting routes redirect exactly `/` to Fora, normalize `/destinome` to
`/destinome/`, serve existing files, and return the SPA entry point for deep
links under `/destinome/`. API requests are handled before the SPA fallback.

`/destinome/api/*` proxies to `https://destinome-api.vercel.app/*`. A request
header transform inserts the production-only sensitive variable
`DESTINOME_API_BYPASS_SECRET` on Vercel's servers. Incoming cookies and the
bypass-cookie request header are removed from that upstream request. The
dedicated API credential is named `Destinome frontend proxy (2026-11-10)` in
the API project's protection settings. It is not a `VITE_*` variable and must
never be exposed to the browser. No database credentials are configured in
the web project. A private recovery copy of its deployment configuration is
in the ignored `.vercel/.env.web.production.local` file.

Verified: 62 frontend tests and the production build; online root redirects,
prefixed assets, map/detail/comparison deep links, same-origin JSON API requests,
expected 400/404 responses, 6,540 destinations, and anonymous access blocked.
The browser renders the OpenFreeMap fallback with destination pins and controls.
The HTTP checks found no API bypass secret or database URL in those responses.

Resolved November 10, 2026: MapTiler's free request quota was exhausted and
the account was temporarily suspended. Its HTTP 403 `Invalid key` response
was misleading. The user upgraded to Flex, after which the existing key
returned HTTP 200 with a valid Hybrid satellite style for both the stable
frontend origin and its deployment origin. The user verified satellite
imagery in the deployed app. No key rotation or rebuild was needed. The
OpenFreeMap fallback remains available, and local development continues to
use OpenFreeMap by default.

MapTiler's published Flex plan is USD 30/month before taxes, with 25,000 map
sessions and 500,000 API requests per month, automatic overage billing, and
an available spending limit. The user completed the upgrade. Configure a
spending limit before relying on it for the public business demo; no limit
has been configured by this setup. Confirm production origin
restrictions as part of the public-launch checks. Do not paste keys into chat.

To restore this frontend version after a later failed release:

```sh
vercel rollback https://destinome-2zsgejoqy-destinome.vercel.app --scope destinome
```

For a future root-mounted `destinome.travel` deployment, use `APP_BASE_PATH=/`,
remove the temporary Fora and mount redirects, and adjust API/SPA route matches
and the SPA destination to the root. Client routing and Vite assets already
support the root mount. Changing only `APP_BASE_PATH` does not update the
temporary domain's explicit hosting routes.
