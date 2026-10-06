import fs from "node:fs";
import path from "node:path";

import { parse } from "csv-parse/sync";

import { db } from "../db.js";
import { destinations } from "../schema/destinations.js";
import { destinationTagScores, tags } from "../schema/scoring.js";

type CsvRow = Record<string, string>;

const tagColumns: Record<string, string> = {
  activities: "activities",
  architecture: "architecture",
  beaches: "beaches",
  boating: "boating",
  budget: "budget",
  camping: "camping",
  culture: "culture",
  cycling: "cycling",
  disability_friendly: "disability-friendly",
  diving: "diving",
  food: "food",
  gambling: "gambling",
  golf: "golf",
  hiking: "hiking",
  kid_friendly: "kid-friendly",
  lgbt_friendly: "lgbt-friendly",
  museums: "museums",
  nature: "nature",
  nightlife: "nightlife",
  overall: "overall",
  photographic_hotspots: "photographic-hotspots",
  public_transit: "public-transit",
  romantic: "romantic",
  safety: "safety",
  scenery: "scenery",
  shopping: "shopping",
  sightseeing: "sightseeing",
  ski: "ski",
  walkability: "walkability",
  wellness: "wellness",
  wildlife: "wildlife",
  winter_sports: "winter-sports",
  women_friendly: "women-friendly",
};

function parseScore(
  value: string | undefined,
  rowNumber: number,
  column: string,
) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const score = Number(trimmed);

  if (!Number.isFinite(score)) {
    throw new Error(`Row ${rowNumber}: Invalid score "${value}" in ${column}`);
  }

  if (score < 0 || score > 10) {
    throw new Error(
      `Row ${rowNumber}: Score ${score} in ${column} must be between 0 and 10`,
    );
  }

  return score;
}

async function importTagScores() {
  const csvPath = path.resolve("data/tag-scores.csv");

  const rows = parse(fs.readFileSync(csvPath, "utf8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[];

  console.log(`Reading ${rows.length} tag-score rows...`);

  await db.transaction(async (tx) => {
    //
    // Resolve destinations by source_id
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

    //
    // Resolve tags by slug
    //

    const tagRows = await tx
      .select({
        id: tags.id,
        slug: tags.slug,
      })
      .from(tags);

    const tagIdBySlug = new Map(tagRows.map((tag) => [tag.slug, tag.id]));

    //
    // Validate our importer mapping against the DB
    //

    for (const slug of Object.values(tagColumns)) {
      if (!tagIdBySlug.has(slug)) {
        throw new Error(`Tag "${slug}" does not exist in the database`);
      }
    }

    //
    // Convert CSV → normalized score rows
    //

    const scoreRows: {
      destinationId: number;
      tagId: number;
      score: number;
      methodologyVersion: string;
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

      for (const [column, slug] of Object.entries(tagColumns)) {
        const score = parseScore(row[column], rowNumber, column);

        // Blank means unknown / no DB record.
        if (score === null) {
          continue;
        }

        const tagId = tagIdBySlug.get(slug);

        if (!tagId) {
          throw new Error(`Could not resolve tag "${slug}"`);
        }

        scoreRows.push({
          destinationId,
          tagId,
          score,
          methodologyVersion: "v1",
        });
      }
    }

    console.log(`Found ${scoreRows.length} populated scores.`);

    //
    // The CSV is the source of truth.
    //
    // Delete the old score dataset and replace it
    // inside the same transaction.
    //

    await tx.delete(destinationTagScores);

    //
    // Insert in batches to avoid huge SQL statements
    //

    const batchSize = 1000;

    for (let offset = 0; offset < scoreRows.length; offset += batchSize) {
      const batch = scoreRows.slice(offset, offset + batchSize);

      await tx.insert(destinationTagScores).values(batch);

      console.log(
        `Imported ${Math.min(
          offset + batch.length,
          scoreRows.length,
        )}/${scoreRows.length} scores`,
      );
    }
  });

  console.log("Tag score import complete.");
}

importTagScores().catch((error) => {
  console.error(error);
  process.exit(1);
});
