import { sql } from "drizzle-orm";

import {
  check,
  integer,
  numeric,
  pgTable,
  primaryKey,
  smallint,
} from "drizzle-orm/pg-core";

import { destinations } from "./destinations.js";

export const destinationMonthlyMetrics = pgTable(
  "destination_monthly_metrics",
  {
    destinationId: integer("destination_id")
      .notNull()
      .references(() => destinations.id, { onDelete: "cascade" }),
    month: smallint("month").notNull(),
    tourismIndex: numeric("tourism_index", {
      precision: 3,
      scale: 1,
      mode: "number",
    }),
    averageHigh: numeric("average_high", {
      precision: 4,
      scale: 1,
      mode: "number",
    }),
    averageLow: numeric("average_low", {
      precision: 4,
      scale: 1,
      mode: "number",
    }),
    clearSkiesChance: numeric("clear_skies_chance", {
      precision: 5,
      scale: 4,
      mode: "number",
    }),
    precipitationDays: numeric("precipitation_days", {
      precision: 4,
      scale: 1,
      mode: "number",
    }),
    rainfall: numeric("rainfall", {
      precision: 6,
      scale: 2,
      mode: "number",
    }),
    snowfall: numeric("snowfall", {
      precision: 6,
      scale: 2,
      mode: "number",
    }),
    daylightHours: numeric("daylight_hours", {
      precision: 4,
      scale: 2,
      mode: "number",
    }),
    muggyDays: numeric("muggy_days", {
      precision: 4,
      scale: 1,
      mode: "number",
    }),
    averageWindSpeed: numeric("average_wind_speed", {
      precision: 4,
      scale: 1,
      mode: "number",
    }),
    averageWaterTemperature: numeric("average_water_temperature", {
      precision: 4,
      scale: 1,
      mode: "number",
    }),
    solarEnergy: numeric("solar_energy", {
      precision: 6,
      scale: 2,
      mode: "number",
    }),
    tourismScore: numeric("tourism_score", {
      precision: 3,
      scale: 1,
      mode: "number",
    }),
    beachPoolScore: numeric("beach_pool_score", {
      precision: 3,
      scale: 1,
      mode: "number",
    }),
  },
  (table) => [
    primaryKey({
      columns: [table.destinationId, table.month],
    }),
    check(
      "monthly_metric_month_range",
      sql`${table.month} >= 1 AND ${table.month} <= 12`,
    ),
    check(
      "tourism_index_range",
      sql`${table.tourismIndex} IS NULL OR (${table.tourismIndex} >= 0 AND ${table.tourismIndex} <= 10)`,
    ),
    check(
      "clear_skies_chance_range",
      sql`${table.clearSkiesChance} IS NULL OR (${table.clearSkiesChance} >= 0 AND ${table.clearSkiesChance} <= 1å)`,
    ),
    check(
      "precipitation_days_range",
      sql`${table.precipitationDays} IS NULL OR (${table.precipitationDays} >= 0 AND ${table.precipitationDays} <= 31)`,
    ),
    check(
      "daylight_hours_range",
      sql`${table.daylightHours} IS NULL OR (${table.daylightHours} >= 0 AND ${table.daylightHours} <= 24)`,
    ),
    check(
      "muggy_days_range",
      sql`${table.muggyDays} IS NULL OR (${table.muggyDays} >= 0 AND ${table.muggyDays} <= 31)`,
    ),
    check(
      "tourism_score_range",
      sql`${table.tourismScore} IS NULL OR (${table.tourismScore} >= 0 AND ${table.tourismScore} <= 10)`,
    ),
    check(
      "beach_pool_score_range",
      sql`${table.beachPoolScore} IS NULL OR (${table.beachPoolScore} >= 0 AND ${table.beachPoolScore} <= 10)`,
    ),
  ],
);
