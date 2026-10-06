import { count, countDistinct, isNotNull } from "drizzle-orm";

import { db, pool } from "../db";

import { destinations } from "../schema/destinations";

import { destinationsContinents } from "../schema/classifications";

import { destinationTagScores } from "../schema/scoring";

import { destinationMonthlyMetrics } from "../schema/monthly";

async function checkData() {
  const [{ value: destinationCount }] = await db
    .select({
      value: count(),
    })
    .from(destinations);

  const [{ value: countryCount }] = await db
    .select({
      value: countDistinct(destinations.countryId),
    })
    .from(destinations);

  const [{ value: climateCount }] = await db
    .select({
      value: count(),
    })
    .from(destinations)
    .where(isNotNull(destinations.climateClassificationId));

  const [{ value: continentDestinationCount }] = await db
    .select({
      value: countDistinct(destinationsContinents.destinationId),
    })
    .from(destinationsContinents);

  const [{ value: continentMappingCount }] = await db
    .select({
      value: count(),
    })
    .from(destinationsContinents);

  const [{ value: scoredDestinationCount }] = await db
    .select({
      value: countDistinct(destinationTagScores.destinationId),
    })
    .from(destinationTagScores);

  const [{ value: scoreCount }] = await db
    .select({
      value: count(),
    })
    .from(destinationTagScores);

  const [{ value: weatherDestinationCount }] = await db
    .select({
      value: countDistinct(destinationMonthlyMetrics.destinationId),
    })
    .from(destinationMonthlyMetrics);

  const [{ value: monthlyMetricCount }] = await db
    .select({
      value: count(),
    })
    .from(destinationMonthlyMetrics);

  console.log("");
  console.log("Destinome Data Check");
  console.log("--------------------");

  console.log(`Destinations:              ${destinationCount}`);

  console.log(`Countries represented:     ${countryCount}`);

  console.log(`With climate data:         ${climateCount}`);

  console.log(`With continent mapping:    ${continentDestinationCount}`);

  console.log(`Continent mappings:        ${continentMappingCount}`);

  console.log(`With tag scores:           ${scoredDestinationCount}`);

  console.log(`Total tag scores:          ${scoreCount}`);

  console.log(`With monthly metrics:      ${weatherDestinationCount}`);

  console.log(`Monthly metric rows:       ${monthlyMetricCount}`);

  console.log("");

  if (continentDestinationCount !== destinationCount) {
    console.warn(
      `⚠ ${
        destinationCount - continentDestinationCount
      } destinations are missing continent mappings.`,
    );
  } else {
    console.log("✓ Every destination has a continent mapping.");
  }
}

checkData()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
