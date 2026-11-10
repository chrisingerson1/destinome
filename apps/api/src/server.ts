import Fastify from "fastify";
import { attachDatabasePool } from "@vercel/functions";

import { db, destinations, pool } from "@destinome/database";

import { routes } from "./routes/index.js";

if (process.env.VERCEL === "1") {
  attachDatabasePool(pool);
}

const app = Fastify({
  logger: true,
});

app.get("/health", async () => {
  return { status: "ok" };
});

app.get("/db-health", async () => {
  const rows = await db
    .select({
      id: destinations.id,
      name: destinations.name,
    })
    .from(destinations)
    .limit(1);

  return {
    status: "ok",
    database: "connected",
    sampleDestination: rows[0] ?? null,
  };
});

await app.register(routes);

async function start() {
  try {
    await app.listen({
      port: 3001,
      host: "0.0.0.0",
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
