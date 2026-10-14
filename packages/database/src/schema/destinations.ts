import {
  AnyPgColumn,
  bigint,
  boolean,
  doublePrecision,
  index,
  integer,
  numeric,
  pgTable,
  smallint,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import {
  administrativeAreas,
  climateClassifications,
  countries,
} from "./geography.js";

export const destinations = pgTable(
  "destinations",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    sourceId: varchar("source_id", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull().unique(),
    parentDestinationId: integer("parent_destination_id").references(
      (): AnyPgColumn => destinations.id,
      { onDelete: "set null" },
    ),
    countryId: integer("country_id")
      .notNull()
      .references(() => countries.id),
    administrativeAreaId: integer("administrative_area_id").references(
      () => administrativeAreas.id,
    ),
    timezone: varchar("timezone", { length: 100 }),
    climateClassificationId: integer("climate_classification_id").references(
      () => climateClassifications.id,
    ),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    elevation: integer("elevation"),
    population: bigint("population", {
      mode: "number",
    }),
    populationYear: smallint("population_year"),
    area: numeric("area", {
      precision: 12,
      scale: 2,
      mode: "number",
    }),
    annualTourists: bigint("annual_tourists", {
      mode: "number",
    }),
    annualTouristsYear: smallint("annual_tourists_year"),
    isAirlineHub: boolean("is_airline_hub").notNull().default(false),
    idealDaysMin: smallint("ideal_days_min"),
    idealDaysMax: smallint("ideal_days_max"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("destinations_parent_destination_id_idx").on(
      table.parentDestinationId,
    ),
  ],
);
