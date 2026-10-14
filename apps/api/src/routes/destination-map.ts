import { FastifyInstance } from "fastify";
import { and, between, eq, isNotNull, sql } from "drizzle-orm";
import {
  countries,
  db,
  destinations,
  destinationTagScores,
  tags,
} from "@destinome/database";

export const destinationMapRoutes = async (app: FastifyInstance) => {
  app.get("/destinations/map", async () => {
    const data = await db
      .select({
        id: destinations.id,
        name: destinations.name,
        slug: destinations.slug,
        parentDestinationId: destinations.parentDestinationId,
        latitude: destinations.latitude,
        longitude: destinations.longitude,
        overallScore: destinationTagScores.score,
        country: countries.name,
      })
      .from(destinations)
      .innerJoin(countries, eq(destinations.countryId, countries.id))
      .leftJoin(tags, eq(tags.slug, "overall"))
      .leftJoin(
        destinationTagScores,
        and(
          eq(destinationTagScores.destinationId, destinations.id),
          eq(destinationTagScores.tagId, tags.id),
        ),
      )
      .where(
        and(
          isNotNull(destinations.latitude),
          isNotNull(destinations.longitude),
          between(destinations.latitude, -90, 90),
          between(destinations.longitude, -180, 180),
        ),
      );
    return { data };
  });

  app.get("/destinations/map/scores", async () => {
    const rows = await db
      .select({
        id: destinations.id,
        scores: sql<Record<string, number | null>>`
        json_object_agg(
          ${tags.slug},
          ${destinationTagScores.score}
        )
      `,
      })
      .from(destinations)
      .innerJoin(
        destinationTagScores,
        eq(destinationTagScores.destinationId, destinations.id),
      )
      .innerJoin(tags, eq(destinationTagScores.tagId, tags.id))
      .where(
        and(
          isNotNull(destinations.latitude),
          isNotNull(destinations.longitude),
        ),
      )
      .groupBy(destinations.id);

    return { data: rows };
  });
};
