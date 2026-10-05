import {
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { destinations } from "./destinations";

export const sources = pgTable("sources", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 250 }).notNull().unique(),
  url: text("url"),
});

export const destinationSources = pgTable(
  "destination_sources",
  {
    destinationId: integer("destination_id")
      .notNull()
      .references(() => destinations.id, { onDelete: "cascade" }),
    sourceId: integer("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    notes: text("notes"),
  },
  (table) => [
    primaryKey({
      columns: [table.destinationId, table.sourceId],
    }),
  ],
);
