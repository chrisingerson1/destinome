import fs from "node:fs";
import path from "node:path";

import { parse } from "csv-parse/sync";

import { db } from "../db";
import { destinations } from "../schema/destinations";
import { destinationMonthlyMetrics } from "../schema/monthly";

type CsvRow = Record<string, string>;

const months = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
] as const;

function parseNumber(
  value: string | undefined,
  rowNumber: number,
  column: string,
) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.replaceAll(",", "");
  const number = Number(normalized);

  if (!Number.isFinite(number)) {
    throw new Error(`Row ${rowNumber}: Invalid number "${value}" in ${column}`);
  }

  return number;
}

function parseFraction(
  value: string | undefined,
  rowNumber: number,
  column: string,
) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  let result: number;

  if (trimmed.endsWith("%")) {
    result = Number(trimmed.slice(0, -1)) / 100;
  } else {
    result = Number(trimmed);
  }

  if (!Number.isFinite(result)) {
    throw new Error(
      `Row ${rowNumber}: Invalid fraction "${value}" in ${column}`,
    );
  }

  if (result < 0 || result > 1) {
    throw new Error(
      `Row ${rowNumber}: ${column} must be between 0 and 1, received ${result}`,
    );
  }

  return result;
}

async function importMonthlyMetrics() {
  const csvPath = path.resolve("data/monthly-metrics.csv");

  const rows = parse(fs.readFileSync(csvPath, "utf8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[];

  console.log(`Reading ${rows.length} monthly-metric source rows...`);

  await db.transaction(async (tx) => {
    //
    // Resolve destinations
    //

    const destinationRows = await tx
      .select({
        id: destinations.id,
        sourceId: destinations.sourceId,
      })
      .from(destinations);

    const destinationIdBySourceId = new Map(
      destinationRows.map((destination) => [
        destination.sourceId,
        destination.id,
      ]),
    );

    const metricRows: {
      destinationId: number;
      month: number;
      tourismIndex: number | null;
      averageHigh: number | null;
      averageLow: number | null;
      clearSkiesChance: number | null;
      precipitationDays: number | null;
      rainfall: number | null;
      snowfall: number | null;
      daylightHours: number | null;
      muggyDays: number | null;
      averageWindSpeed: number | null;
      averageWaterTemperature: number | null;
      solarEnergy: number | null;
    }[] = [];

    const seenSourceIds = new Set<string>();

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNumber = index + 2;

      const sourceId = row.source_id?.trim();

      if (!sourceId) {
        throw new Error(`Row ${rowNumber}: Missing source_id`);
      }

      if (seenSourceIds.has(sourceId)) {
        throw new Error(`Row ${rowNumber}: Duplicate source_id "${sourceId}"`);
      }

      seenSourceIds.add(sourceId);

      const destinationId = destinationIdBySourceId.get(sourceId);

      if (!destinationId) {
        throw new Error(`Row ${rowNumber}: Unknown source_id "${sourceId}"`);
      }

      for (let monthIndex = 0; monthIndex < months.length; monthIndex++) {
        const monthName = months[monthIndex];
        const month = monthIndex + 1;

        const tourismIndex = parseNumber(
          row[`tourism_index_${monthName}`],
          rowNumber,
          `tourism_index_${monthName}`,
        );

        const averageHigh = parseNumber(
          row[`average_high_f_${monthName}`],
          rowNumber,
          `average_high_f_${monthName}`,
        );

        const averageLow = parseNumber(
          row[`average_low_f_${monthName}`],
          rowNumber,
          `average_low_f_${monthName}`,
        );

        const clearSkiesChance = parseFraction(
          row[`clear_skies_pct_${monthName}`],
          rowNumber,
          `clear_skies_pct_${monthName}`,
        );

        const precipitationDays = parseNumber(
          row[`precipitation_days_${monthName}`],
          rowNumber,
          `precipitation_days_${monthName}`,
        );

        const rainfall = parseNumber(
          row[`rainfall_in_${monthName}`],
          rowNumber,
          `rainfall_in_${monthName}`,
        );

        const snowfall = parseNumber(
          row[`snowfall_in_${monthName}`],
          rowNumber,
          `snowfall_in_${monthName}`,
        );

        const daylightHours = parseNumber(
          row[`daylight_hours_${monthName}`],
          rowNumber,
          `daylight_hours_${monthName}`,
        );

        const muggyDays = parseNumber(
          row[`muggy_days_${monthName}`],
          rowNumber,
          `muggy_days_${monthName}`,
        );

        const averageWindSpeed = parseNumber(
          row[`average_wind_speed_mph_${monthName}`],
          rowNumber,
          `average_wind_speed_mph_${monthName}`,
        );

        const averageWaterTemperature = parseNumber(
          row[`average_water_temperature_f_${monthName}`],
          rowNumber,
          `average_water_temperature_f_${monthName}`,
        );

        const solarEnergy = parseNumber(
          row[`solar_energy_kwh_m2_${monthName}`],
          rowNumber,
          `solar_energy_kwh_m2_${monthName}`,
        );

        //
        // Don't create an empty month row.
        //

        const values = [
          tourismIndex,
          averageHigh,
          averageLow,
          clearSkiesChance,
          precipitationDays,
          rainfall,
          snowfall,
          daylightHours,
          muggyDays,
          averageWindSpeed,
          averageWaterTemperature,
          solarEnergy,
        ];

        if (values.every((value) => value === null)) {
          continue;
        }

        //
        // Basic range validation
        //

        if (tourismIndex !== null && (tourismIndex < 0 || tourismIndex > 10)) {
          throw new Error(
            `Row ${rowNumber}: tourism_index_${monthName} must be 0-10`,
          );
        }

        if (
          precipitationDays !== null &&
          (precipitationDays < 0 || precipitationDays > 31)
        ) {
          throw new Error(
            `Row ${rowNumber}: precipitation_days_${monthName} must be 0-31`,
          );
        }

        if (
          daylightHours !== null &&
          (daylightHours < 0 || daylightHours > 24)
        ) {
          throw new Error(
            `Row ${rowNumber}: daylight_hours_${monthName} must be 0-24`,
          );
        }

        if (muggyDays !== null && (muggyDays < 0 || muggyDays > 31)) {
          throw new Error(
            `Row ${rowNumber}: muggy_days_${monthName} must be 0-31`,
          );
        }

        metricRows.push({
          destinationId,
          month,
          tourismIndex,
          averageHigh,
          averageLow,
          clearSkiesChance,
          precipitationDays,
          rainfall,
          snowfall,
          daylightHours,
          muggyDays,
          averageWindSpeed,
          averageWaterTemperature,
          solarEnergy,
        });
      }
    }

    console.log(`Found ${metricRows.length} populated destination/month rows.`);

    //
    // CSV is source of truth
    //

    await tx.delete(destinationMonthlyMetrics);

    //
    // Batch inserts
    //

    const batchSize = 500;

    for (let offset = 0; offset < metricRows.length; offset += batchSize) {
      const batch = metricRows.slice(offset, offset + batchSize);

      await tx.insert(destinationMonthlyMetrics).values(batch);

      console.log(
        `Imported ${Math.min(
          offset + batch.length,
          metricRows.length,
        )}/${metricRows.length} monthly rows`,
      );
    }
  });

  console.log("Monthly metrics import complete.");
}

importMonthlyMetrics().catch((error) => {
  console.error(error);
  process.exit(1);
});
