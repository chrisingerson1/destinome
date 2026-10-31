import { sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { stripSearchAccents } from "./search.js";

import {
  administrativeAreas,
  countries,
  destinations,
} from "@destinome/database";

export const adminArea = alias(administrativeAreas, "admin_area");
export const parentAdminArea = alias(administrativeAreas, "parent_admin_area");

export const searchableLocation = sql<string>`
  regexp_replace(
    ${stripSearchAccents(sql`concat_ws(
      ' ',
      ${destinations.name},
      ${parentAdminArea.name},
      ${adminArea.name},
      ${countries.name},
      ${countries.iso2},
      ${countries.iso3}
    )`)},
    '[[:punct:]]+',
    ' ',
    'g'
  )
`;
