import { FastifyInstance } from "fastify";
import { and, between, eq, isNotNull } from "drizzle-orm";
import {
  db,
  destinations,
  tags,
  destinationTagScores,
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
      })
      .from(destinations)
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
};
