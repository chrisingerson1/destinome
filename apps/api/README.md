# Destinations API

`GET /destinations` returns destination summaries with `data` and `pagination`.
Existing search, pagination, continent, climate, and score filters remain supported.

For discovery, use `/destinations?sort=overall&scores=food:8,nature:7&page=1&limit=20`.
All score minimums must be met. Scores range from 0 to 10, and missing scores do
not meet a minimum. Invalid filters and unknown category slugs return HTTP 400.
`sort=overall` orders by overall score descending, missing scores last, then name
and ID. Omitting it preserves alphabetical ordering or search relevance ordering.

Each summary includes these additional fields:

- `parentDestinationId`: the parent ID, or `null` for a top-level destination.
- `parentDestination`: `{ id, name, slug }`, or `null` when there is no parent.
- `scores`: numeric scores keyed by the categories in the `scores` query parameter,
  such as `{ "food": 8.5, "nature": 7 }`. Without score filters this is `{}`.
  An unavailable value is `null`, never an assumed zero.

Neighborhoods are included alongside top-level destinations. Enrichment does not
change the existing summary fields or pagination totals.

Run `npm test --workspace=@destinome/api` from the repository root. Tests intercept
database queries; they do not require or verify a live PostgreSQL database.
