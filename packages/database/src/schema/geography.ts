import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  smallint,
  unique,
  varchar,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

export const continents = pgTable("continents", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 150 }).notNull().unique(),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
});

export const countries = pgTable("countries", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 150 }).notNull().unique(),
  iso2: varchar("iso2", { length: 2 }).notNull().unique(),
  iso3: varchar("iso3", { length: 3 }).notNull().unique(),
  isSovereign: boolean("is_sovereign").notNull().default(true),
  sovereignCountryId: integer("sovereign_country_id").references(
    (): AnyPgColumn => countries.id,
  ),
});

export const countriesContinents = pgTable(
  "countries_continents",
  {
    countryId: integer("country_id")
      .notNull()
      .references(() => countries.id),
    continentId: integer("continent_id")
      .notNull()
      .references(() => continents.id),
    isPrimary: boolean("is_primary").notNull().default(true),
  },
  (table) => [
    primaryKey({
      columns: [table.countryId, table.continentId],
    }),
  ],
);

// state, county, province, district, municipality, etc.
export const administrativeAreas = pgTable(
  "administrative_areas",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    countryId: integer("country_id")
      .notNull()
      .references(() => countries.id),
    parentId: integer("parent_id").references(
      (): AnyPgColumn => administrativeAreas.id,
    ),
    name: varchar("name", { length: 200 }).notNull(),
    level: smallint("level").notNull(),
  },
  (table) => [
    unique("administrative_area_unique_idx")
      .on(table.countryId, table.parentId, table.level, table.name)
      .nullsNotDistinct(),
  ],
);

export const geoSubregions = pgTable("geo_subregions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 150 }).notNull().unique(),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
});

export const climateClassifications = pgTable("climate_classifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  code: varchar("code", { length: 4 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
});
