import {
  bigint,
  boolean,
  doublePrecision,
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
} from "./geography";

export const destinations = pgTable("destinations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
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
});
