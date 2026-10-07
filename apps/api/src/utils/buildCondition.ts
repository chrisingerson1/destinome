import { and, eq, gte, inArray, or, sql } from "drizzle-orm";

import { searchableLocation } from "./constants.js";
import type { ScoreFilter } from "./parseScoreParams.js";

import {
  climateClassifications,
  continents,
  destinations,
  destinationsContinents,
  destinationTagScores,
  tags,
} from "@destinome/database";

export function buildContinentCondition(slugs: string[]) {
  return slugs.length > 0
    ? sql<boolean>`
        EXISTS (
          SELECT 1
          FROM ${destinationsContinents}
          INNER JOIN ${continents}
            ON ${destinationsContinents.continentId} = ${continents.id}
          WHERE
            ${destinationsContinents.destinationId} = ${destinations.id}
            AND ${continents.slug} IN (
              ${sql.join(
                slugs.map((slug) => sql`${slug}`),
                sql`, `,
              )}
            )
        )
      `
    : undefined;
}

export function buildClimateCondition(codes: string[]) {
  return codes.length > 0
    ? sql<boolean>`
        ${destinations.climateClassificationId} IN (
          SELECT ${climateClassifications.id}
          FROM ${climateClassifications}
          WHERE ${inArray(climateClassifications.code, codes)}
        )
      `
    : undefined;
}

export function buildScoreCondition(filters: ScoreFilter[]) {
  if (filters.length === 0) {
    return undefined;
  }

  return and(
    ...filters.map(
      ({ slug, min }) => sql<boolean>`
        EXISTS (
          SELECT 1
          FROM ${destinationTagScores}
          INNER JOIN ${tags}
            ON ${destinationTagScores.tagId} = ${tags.id}
          WHERE
            ${destinationTagScores.destinationId} = ${destinations.id}
            AND ${tags.slug} = ${slug}
            AND ${destinationTagScores.score} >= ${min}
        )
      `,
    ),
  );
}

export function buildSearchCondition(patterns: string[]) {
  return patterns.length > 0
    ? or(
        ...patterns.map(
          (pattern) => sql`${searchableLocation} ILIKE ${pattern}`,
        ),
      )
    : undefined;
}
