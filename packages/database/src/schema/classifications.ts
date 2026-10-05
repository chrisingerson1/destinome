import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  varchar,
} from "drizzle-orm/pg-core";

import { destinations } from "./destinations";
import { continents, geoSubregions } from "./geography";

export const destinationTypes = pgTable("destination_types", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
});

export const destinationsDestinationTypes = pgTable(
  "destinations_destination_types",
  {
    destinationId: integer("destination_id")
      .notNull()
      .references(() => destinations.id, { onDelete: "cascade" }),
    destinationTypeId: integer("destination_type_id")
      .notNull()
      .references(() => destinationTypes.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({
      columns: [table.destinationId, table.destinationTypeId],
    }),
  ],
);

export const destinationsGeoSubregions = pgTable(
  "destinations_geo_subregions",
  {
    destinationId: integer("destination_id")
      .notNull()
      .references(() => destinations.id, { onDelete: "cascade" }),
    geoSubregionId: integer("geo_subregion_id")
      .notNull()
      .references(() => geoSubregions.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({
      columns: [table.destinationId, table.geoSubregionId],
    }),
  ],
);

// handles edge cases a city may be in multiple continents, e.g. Istanbul, Turkey (Europe and Asia)
export const destinationsContinents = pgTable(
  "destinations_continents",
  {
    destinationId: integer("destination_id")
      .notNull()
      .references(() => destinations.id, { onDelete: "cascade" }),
    continentId: integer("continent_id")
      .notNull()
      .references(() => continents.id, { onDelete: "cascade" }),
    isPrimary: boolean("is_primary").notNull().default(true),
  },
  (table) => [
    primaryKey({
      columns: [table.destinationId, table.continentId],
    }),
  ],
);
