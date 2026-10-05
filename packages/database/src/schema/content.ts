import {
  integer,
  pgTable,
  primaryKey,
  text,
  varchar,
} from "drizzle-orm/pg-core";

import { destinations } from "./destinations";

export const knownFor = pgTable("known_for", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
});

export const destinationsKnownFor = pgTable(
  "destinations_known_for",
  {
    destinationId: integer("destination_id")
      .notNull()
      .references(() => destinations.id, { onDelete: "cascade" }),
    knownForId: integer("known_for_id")
      .notNull()
      .references(() => knownFor.id, { onDelete: "cascade" }),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (table) => [
    primaryKey({
      columns: [table.destinationId, table.knownForId],
    }),
  ],
);

export const placesToVisit = pgTable("places_to_visit", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  destinationId: integer("destination_id")
    .notNull()
    .references(() => destinations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 250 }).notNull(),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0),
});
