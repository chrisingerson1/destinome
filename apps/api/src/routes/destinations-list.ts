import type { FastifyInstance } from "fastify";
import { StatusCodes } from "http-status-codes";

import { and, asc, count, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import {
  countries,
  db,
  destinations,
  destinationTagScores,
  tags,
} from "@destinome/database";

import {
  adminArea,
  buildContinentCondition,
  buildClimateCondition,
  buildScoreCondition,
  buildSearchCondition,
  getSearchPatterns,
  normalizeSearchText,
  parentAdminArea,
  parseScoreParams,
  splitURLParams,
  stripSearchAccents,
} from "../utils/index.js";
import { InvalidScoreFilterError, type ScoreFilter } from "../utils/parseScoreParams.js";

type DestinationQuery = {
  page?: string;
  limit?: string;
  search?: string;
  continents?: string;
  climates?: string;
  scores?: string;
  sort?: string;
};

const parentDestination = alias(destinations, "parent_destination");

export async function destinationsListRoutes(app: FastifyInstance) {
  app.get<{ Querystring: DestinationQuery }>(
    "/destinations",
    async (request, reply) => {
      const page = Number(request.query.page ?? 1);
      const limit = Number(request.query.limit ?? 50);

      if (!Number.isInteger(page) || page < 1) {
        return reply
          .code(StatusCodes.BAD_REQUEST)
          .send({ error: "Page must be a positive integer" });
      }

      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        return reply
          .code(StatusCodes.BAD_REQUEST)
          .send({ error: "Limit must be between 1 and 100" });
      }

      if (request.query.sort !== undefined && request.query.sort !== "overall") {
        return reply
          .code(StatusCodes.BAD_REQUEST)
          .send({ error: "Sort must be overall when provided" });
      }

      const offset = (page - 1) * limit;

      const search = (request.query.search ?? "").trim();
      const normalizedSearch = normalizeSearchText(search);
      const searchableName = stripSearchAccents(destinations.name);
      const searchPatterns = getSearchPatterns(search);
      const searchCondition = buildSearchCondition(searchPatterns);

      const continentSlugs = splitURLParams(request.query.continents);
      const continentCondition = buildContinentCondition(continentSlugs);

      const climateCodes = splitURLParams(request.query.climates, false);
      const climateCondition = buildClimateCondition(climateCodes);

      let scoreFilters: ScoreFilter[];
      try {
        scoreFilters = parseScoreParams(request.query.scores);
      } catch (error) {
        if (!(error instanceof InvalidScoreFilterError)) throw error;
        return reply.code(StatusCodes.BAD_REQUEST).send({ error: error.message });
      }

      const requestedSlugs = [...new Set(scoreFilters.map(({ slug }) => slug))];
      if (requestedSlugs.length > 0) {
        const knownTags = await db
          .select({ slug: tags.slug })
          .from(tags)
          .where(inArray(tags.slug, requestedSlugs));
        const knownSlugs = new Set(knownTags.map(({ slug }) => slug));
        const unknownSlugs = requestedSlugs.filter((slug) => !knownSlugs.has(slug));

        if (unknownSlugs.length > 0) {
          return reply.code(StatusCodes.BAD_REQUEST).send({
            error: `Unknown score categories: ${unknownSlugs.join(", ")}`,
          });
        }
      }

      const scoreCondition = buildScoreCondition(scoreFilters);

      const whereCondition = and(
        searchCondition,
        continentCondition,
        climateCondition,
        scoreCondition,
      );

      const baseQuery = db
        .select({
          id: destinations.id,
          sourceId: destinations.sourceId,
          name: destinations.name,
          slug: destinations.slug,

          country: {
            name: countries.name,
            iso2: countries.iso2,
            iso3: countries.iso3,
          },

          adminArea: sql<
            string | null
          >`COALESCE(${parentAdminArea.name}, ${adminArea.name})`,

          overallScore: destinationTagScores.score,
          parentDestinationId: destinations.parentDestinationId,
          parentDestination: {
            id: parentDestination.id,
            name: parentDestination.name,
            slug: parentDestination.slug,
          },
        })
        .from(destinations)
        .innerJoin(countries, eq(destinations.countryId, countries.id))
        .leftJoin(
          parentDestination,
          eq(destinations.parentDestinationId, parentDestination.id),
        )
        .leftJoin(
          adminArea,
          eq(destinations.administrativeAreaId, adminArea.id),
        )
        .leftJoin(parentAdminArea, eq(adminArea.parentId, parentAdminArea.id))
        .leftJoin(tags, eq(tags.slug, "overall"))
        .leftJoin(
          destinationTagScores,
          and(
            eq(destinationTagScores.destinationId, destinations.id),
            eq(destinationTagScores.tagId, tags.id),
          ),
        );

      const countQuery = db
        .select({ total: count() })
        .from(destinations)
        .innerJoin(countries, eq(destinations.countryId, countries.id))
        .leftJoin(
          adminArea,
          eq(destinations.administrativeAreaId, adminArea.id),
        )
        .leftJoin(parentAdminArea, eq(adminArea.parentId, parentAdminArea.id));

      const [rows, [{ total }]] = await Promise.all([
        baseQuery
          .where(whereCondition)
          .orderBy(
            ...(request.query.sort === "overall"
              ? [
                  sql`${destinationTagScores.score} DESC NULLS LAST`,
                  sql`${destinations.name} COLLATE "und-x-icu" ASC`,
                  asc(destinations.id),
                ]
              : search
              ? [
                  // Exact matches first, then prefix matches, then other matches.
                  sql`CASE
                    WHEN LOWER(${searchableName}) = ${normalizedSearch} THEN 0
                    WHEN ${searchableName} ILIKE ${`${normalizedSearch}%`} THEN 1
                    ELSE 2
                  END`,

                  // Within each relevance group, prioritize better destinations.
                  sql`${destinationTagScores.score} DESC NULLS LAST`,

                  // Stable alphabetical tie-breaking.
                  sql`${destinations.name} COLLATE "und-x-icu" ASC`,
                  asc(destinations.id),
                ]
              : [
                  // Preserve alphabetical sorting when not searching.
                  sql`${destinations.name} COLLATE "und-x-icu" ASC`,
                  asc(destinations.id),
                ]),
          )
          .limit(limit)
          .offset(offset),

        countQuery.where(whereCondition),
      ]);

      // Fetch selected scores once for this page, without multiplying list rows
      // or changing pagination when a destination has several category scores.
      const scoreRows = rows.length > 0 && requestedSlugs.length > 0
        ? await db
            .select({
              destinationId: destinationTagScores.destinationId,
              slug: tags.slug,
              score: destinationTagScores.score,
            })
            .from(destinationTagScores)
            .innerJoin(tags, eq(destinationTagScores.tagId, tags.id))
            .where(and(
              inArray(destinationTagScores.destinationId, rows.map(({ id }) => id)),
              inArray(tags.slug, requestedSlugs),
            ))
        : [];

      const scoresByDestination = new Map<number, Record<string, number | null>>();
      for (const row of rows) {
        scoresByDestination.set(row.id, Object.fromEntries(
          requestedSlugs.map((slug) => [slug, null]),
        ));
      }
      for (const { destinationId, slug, score } of scoreRows) {
        scoresByDestination.get(destinationId)![slug] = score;
      }

      return {
        data: rows.map((row) => ({
          ...row,
          scores: scoresByDestination.get(row.id)!,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    },
  );
}
