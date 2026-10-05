import { sql } from "drizzle-orm";

import {
  check,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { destinations } from "./destinations";

export const tags = pgTable("tags", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
});

export const destinationTagScores = pgTable(
  "destination_tag_scores",
  {
    destinationId: integer("destination_id")
      .notNull()
      .references(() => destinations.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    score: numeric("score", {
      precision: 3,
      scale: 1,
      mode: "number",
    }).notNull(),
    notes: text("notes"),
    methodologyVersion: varchar("methodology_version", { length: 50 }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.destinationId, table.tagId],
    }),
    check(
      "destination_tag_score_range",
      sql`${table.score} >= 0 AND ${table.score} <= 10`,
    ),
  ],
);
