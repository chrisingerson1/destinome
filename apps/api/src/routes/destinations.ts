import type { FastifyInstance } from "fastify";
import { StatusCodes } from "http-status-codes";

import { and, asc, count, eq, sql } from "drizzle-orm";

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
  parentAdminArea,
  parseScoreParams,
  splitURLParams,
} from "../utils/index.js";

type DestinationQuery = {
  page?: string;
  limit?: string;
  search?: string;
  continents?: string;
  climates?: string;
  scores?: string;
};

export async function destinationRoutes(app: FastifyInstance) {
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

      const offset = (page - 1) * limit;

      const searchPatterns = getSearchPatterns(request.query.search ?? "");
      const searchCondition = buildSearchCondition(searchPatterns);

      const continentSlugs = splitURLParams(request.query.continents);
      const continentCondition = buildContinentCondition(continentSlugs);

      const climateCodes = splitURLParams(request.query.climates, false);
      const climateCondition = buildClimateCondition(climateCodes);

      const scoreFilters = parseScoreParams(request.query.scores);
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
        })
        .from(destinations)
        .innerJoin(countries, eq(destinations.countryId, countries.id))
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
            // Use ICU collation for proper alphabetical sorting of destination names
            sql`${destinations.name} COLLATE "und-x-icu" ASC`,
            asc(destinations.id),
          )
          .limit(limit)
          .offset(offset),

        countQuery.where(whereCondition),
      ]);

      return {
        data: rows,
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
