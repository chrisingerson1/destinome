import type { FastifyInstance } from "fastify";

import { destinationDetailsRoutes } from "./destination-details.js";
import { destinationsListRoutes } from "./destinations-list.js";
import { destinationMapRoutes } from "./destination-map.js";

export async function routes(app: FastifyInstance) {
  await app.register(destinationsListRoutes);
  await app.register(destinationDetailsRoutes);
  await app.register(destinationMapRoutes);
}
