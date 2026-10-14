import fs from "node:fs";
import path from "node:path";

import { parse } from "csv-parse/sync";
import { and, eq, isNull } from "drizzle-orm";
import slugify from "slugify";

import { db } from "../db.js";

import {
  administrativeAreas,
  climateClassifications,
  continents,
  countries,
  geoSubregions,
} from "../schema/geography.js";

import { destinations } from "../schema/destinations.js";

import {
  destinationsContinents,
  destinationsGeoSubregions,
} from "../schema/classifications.js";

type CsvRow = {
  source_id: string;
  parent_source_id: string;
  name: string;
  country: string;
  admin_area_1: string;
  admin_area_2: string;
  continent_1: string;
  continent_2: string;
  geo_subregion_1: string;
  geo_subregion_2: string;
  geo_subregion_3: string;
  latitude: string;
  longitude: string;
  timezone: string;
  elevation_m: string;
  population: string;
  population_year: string;
  area_sq_km: string;
  annual_tourists: string;
  annual_tourists_year: string;
  airline_hub: string;
  climate_code: string;
  ideal_days_min: string;
  ideal_days_max: string;
};

const nullableString = (value: string): string | null => {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
};

const nullableNumber = (value: string): number | null => {
  const trimmed = value?.trim().replaceAll(",", "");

  if (!trimmed) {
    return null;
  }

  const result = Number(trimmed);

  if (Number.isNaN(result)) {
    throw new Error(`Invalid number: "${value}"`);
  }

  return result;
};

const nullableBoolean = (value: string): boolean | null => {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  if (["true", "yes", "1", "x"].includes(normalized)) {
    return true;
  }

  if (["false", "no", "0"].includes(normalized)) {
    return false;
  }

  throw new Error(`Invalid boolean: "${value}"`);
};

// -----------------------------------------------------------------------------
// Validate destination relationships before writing anything to the database.
// -----------------------------------------------------------------------------

const validateParentDestinations = (rows: CsvRow[]): void => {
  const sourceRows = new Map<string, { row: CsvRow; line: number }>();

  // Ensure source IDs are present and unique.
  for (const [index, row] of rows.entries()) {
    const line = index + 2;
    const sourceId = nullableString(row.source_id);

    if (!sourceId) {
      throw new Error(`Row ${line}: Missing source_id`);
    }

    const existing = sourceRows.get(sourceId);

    if (existing) {
      throw new Error(
        `Row ${line}: Duplicate source_id "${sourceId}" ` +
          `(first seen on row ${existing.line})`,
      );
    }

    sourceRows.set(sourceId, { row, line });
  }

  // Validate each declared parent.
  for (const [index, row] of rows.entries()) {
    const line = index + 2;
    const sourceId = row.source_id.trim();
    const parentSourceId = nullableString(row.parent_source_id);

    if (!parentSourceId) {
      continue;
    }

    // No destination may be its own parent.
    if (parentSourceId === sourceId) {
      throw new Error(
        `Row ${line}: Destination "${row.name}" cannot be its own parent`,
      );
    }

    const parent = sourceRows.get(parentSourceId);

    // Every referenced parent must exist in this import.
    if (!parent) {
      throw new Error(
        `Row ${line}: Parent source_id "${parentSourceId}" ` +
          `for "${row.name}" was not found in the CSV`,
      );
    }

    // Neighborhood and parent must belong to the same country.
    if (parent.row.country !== row.country) {
      throw new Error(
        `Row ${line}: "${row.name}" and its parent ` +
          `"${parent.row.name}" belong to different countries`,
      );
    }

    // Enforce a single level of parent-child relationships.
    // This also prevents circular references.
    if (nullableString(parent.row.parent_source_id)) {
      throw new Error(
        `Row ${line}: "${row.name}" references ` +
          `"${parent.row.name}", which already has a parent. ` +
          `Nested parent relationships are not supported.`,
      );
    }
  }
};

// -----------------------------------------------------------------------------
// Import
// -----------------------------------------------------------------------------

const importDestinations = async () => {
  const csvPath = path.resolve("data/destinations.csv");

  const rows = parse(fs.readFileSync(csvPath, "utf8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[];

  if (rows.length === 0) {
    throw new Error("Destination CSV contains no rows");
  }

  if (!("parent_source_id" in rows[0])) {
    throw new Error('Destination CSV is missing the "parent_source_id" column');
  }

  // Validate before opening the database transaction.
  validateParentDestinations(rows);

  console.log(`Importing ${rows.length} destinations...`);

  await db.transaction(async (tx) => {
    // -------------------------------------------------------------------------
    // Reference tables
    // -------------------------------------------------------------------------

    const countryRows = await tx
      .select({
        id: countries.id,
        name: countries.name,
      })
      .from(countries);

    const countryIdByName = new Map(
      countryRows.map((country) => [country.name, country.id]),
    );

    const continentRows = await tx
      .select({
        id: continents.id,
        name: continents.name,
      })
      .from(continents);

    const continentIdByName = new Map(
      continentRows.map((continent) => [continent.name, continent.id]),
    );

    const climateRows = await tx
      .select({
        id: climateClassifications.id,
        code: climateClassifications.code,
      })
      .from(climateClassifications);

    const climateIdByCode = new Map(
      climateRows.map((climate) => [climate.code, climate.id]),
    );

    // Remember the database ID assigned to each source ID.
    const destinationIdBySourceId = new Map<string, number>();

    // -------------------------------------------------------------------------
    // Pass 1: Import or update every destination
    // -------------------------------------------------------------------------

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const sourceId = row.source_id.trim();

      const countryId = countryIdByName.get(row.country);

      if (!countryId) {
        throw new Error(`Row ${index + 2}: Unknown country "${row.country}"`);
      }

      const adminArea1Name = nullableString(row.admin_area_1);
      const adminArea2Name = nullableString(row.admin_area_2);

      let adminArea1Id: number | null = null;
      let adminArea2Id: number | null = null;

      // -----------------------------------------------------------------------
      // Admin area level 1
      // -----------------------------------------------------------------------

      if (adminArea1Name) {
        await tx
          .insert(administrativeAreas)
          .values({
            countryId,
            parentId: null,
            name: adminArea1Name,
            level: 1,
          })
          .onConflictDoNothing();

        const [adminArea1] = await tx
          .select({
            id: administrativeAreas.id,
          })
          .from(administrativeAreas)
          .where(
            and(
              eq(administrativeAreas.countryId, countryId),
              isNull(administrativeAreas.parentId),
              eq(administrativeAreas.level, 1),
              eq(administrativeAreas.name, adminArea1Name),
            ),
          );

        if (!adminArea1) {
          throw new Error(`Could not resolve admin area "${adminArea1Name}"`);
        }

        adminArea1Id = adminArea1.id;
      }

      // -----------------------------------------------------------------------
      // Admin area level 2
      // -----------------------------------------------------------------------

      if (adminArea2Name) {
        await tx
          .insert(administrativeAreas)
          .values({
            countryId,
            parentId: adminArea1Id,
            name: adminArea2Name,
            level: 2,
          })
          .onConflictDoNothing();

        const conditions = [
          eq(administrativeAreas.countryId, countryId),
          eq(administrativeAreas.level, 2),
          eq(administrativeAreas.name, adminArea2Name),
        ];

        if (adminArea1Id === null) {
          conditions.push(isNull(administrativeAreas.parentId));
        } else {
          conditions.push(eq(administrativeAreas.parentId, adminArea1Id));
        }

        const [adminArea2] = await tx
          .select({
            id: administrativeAreas.id,
          })
          .from(administrativeAreas)
          .where(and(...conditions));

        if (!adminArea2) {
          throw new Error(
            `Could not resolve geo-subregion "${adminArea2Name}"`,
          );
        }

        adminArea2Id = adminArea2.id;
      }

      // -----------------------------------------------------------------------
      // Climate
      // -----------------------------------------------------------------------

      const climateCode = nullableString(row.climate_code);

      const climateClassificationId =
        climateCode === null ? null : climateIdByCode.get(climateCode);

      if (climateCode && climateClassificationId === undefined) {
        throw new Error(
          `Row ${index + 2}: Unknown climate code "${climateCode}"`,
        );
      }

      // -----------------------------------------------------------------------
      // Destination
      // -----------------------------------------------------------------------

      const destinationValues = {
        sourceId,
        name: row.name,
        slug: `source-${sourceId}`,
        countryId,
        administrativeAreaId: adminArea2Id ?? adminArea1Id,
        parentDestinationId: null,
        climateClassificationId: climateClassificationId ?? null,
        latitude: nullableNumber(row.latitude),
        longitude: nullableNumber(row.longitude),
        timezone: nullableString(row.timezone),
        elevation: nullableNumber(row.elevation_m),
        population: nullableNumber(row.population),
        populationYear: nullableNumber(row.population_year),
        area: nullableNumber(row.area_sq_km),
        annualTourists: nullableNumber(row.annual_tourists),
        annualTouristsYear: nullableNumber(row.annual_tourists_year),
        isAirlineHub: nullableBoolean(row.airline_hub) ?? false,
        idealDaysMin: nullableNumber(row.ideal_days_min),
        idealDaysMax: nullableNumber(row.ideal_days_max),
      };

      const [destination] = await tx
        .insert(destinations)
        .values(destinationValues)
        .onConflictDoUpdate({
          target: destinations.sourceId,
          set: destinationValues,
        })
        .returning({
          id: destinations.id,
        });

      if (!destination) {
        throw new Error(`Row ${index + 2}: Failed to import "${row.name}"`);
      }

      destinationIdBySourceId.set(sourceId, destination.id);

      // -----------------------------------------------------------------------
      // Continents
      // -----------------------------------------------------------------------

      const destinationContinents = [
        nullableString(row.continent_1),
        nullableString(row.continent_2),
      ].filter((value): value is string => value !== null);

      await tx
        .delete(destinationsContinents)
        .where(eq(destinationsContinents.destinationId, destination.id));

      for (let i = 0; i < destinationContinents.length; i++) {
        const continentName = destinationContinents[i];

        const continentId = continentIdByName.get(continentName);

        if (!continentId) {
          throw new Error(
            `Row ${index + 2}: Unknown continent "${continentName}"`,
          );
        }

        await tx.insert(destinationsContinents).values({
          destinationId: destination.id,
          continentId,
          isPrimary: i === 0,
        });
      }

      // -----------------------------------------------------------------------
      // Geo-subregions
      // -----------------------------------------------------------------------

      const subregionNames = [
        nullableString(row.geo_subregion_1),
        nullableString(row.geo_subregion_2),
        nullableString(row.geo_subregion_3),
      ].filter((value): value is string => value !== null);

      await tx
        .delete(destinationsGeoSubregions)
        .where(eq(destinationsGeoSubregions.destinationId, destination.id));

      for (const subregionName of subregionNames) {
        const subregionSlug = slugify(subregionName, {
          lower: true,
          strict: true,
        });

        await tx
          .insert(geoSubregions)
          .values({
            name: subregionName,
            slug: subregionSlug,
          })
          .onConflictDoNothing();

        const [subregion] = await tx
          .select({
            id: geoSubregions.id,
          })
          .from(geoSubregions)
          .where(eq(geoSubregions.slug, subregionSlug));

        if (!subregion) {
          throw new Error(`Could not resolve geo-subregion "${subregionName}"`);
        }

        await tx
          .insert(destinationsGeoSubregions)
          .values({
            destinationId: destination.id,
            geoSubregionId: subregion.id,
          })
          .onConflictDoNothing();
      }

      if ((index + 1) % 250 === 0 || index === rows.length - 1) {
        console.log(`Imported ${index + 1}/${rows.length}`);
      }
    }

    // -------------------------------------------------------------------------
    // Pass 2: Link neighborhoods to their parents
    // -------------------------------------------------------------------------

    console.log("Linking parent destinations...");

    let linkedCount = 0;

    for (const row of rows) {
      const sourceId = row.source_id.trim();
      const parentSourceId = nullableString(row.parent_source_id);

      if (!parentSourceId) {
        // Already cleared to null during the first pass.
        continue;
      }

      const destinationId = destinationIdBySourceId.get(sourceId);

      const parentDestinationId = destinationIdBySourceId.get(parentSourceId);

      if (destinationId === undefined || parentDestinationId === undefined) {
        throw new Error(
          `Unable to resolve parent relationship: ` +
            `"${sourceId}" → "${parentSourceId}"`,
        );
      }

      await tx
        .update(destinations)
        .set({
          parentDestinationId,
        })
        .where(eq(destinations.id, destinationId));

      linkedCount++;
    }

    console.log(`Linked ${linkedCount} neighborhoods to parent destinations.`);
  });

  console.log("Destination import complete.");
};

importDestinations().catch((error) => {
  console.error(error);
  process.exit(1);
});
