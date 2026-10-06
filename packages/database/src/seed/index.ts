import { pool } from "../db";

import { seedContinents } from "./continents";
import { seedCountries } from "./countries";
import { seedClimateClassifications } from "./climate-classifications";
import { seedDestinationTypes } from "./destination-types";
import { seedTags } from "./tags";

async function seed() {
  await seedContinents();
  await seedCountries();
  await seedClimateClassifications();
  await seedDestinationTypes();
  await seedTags();
}

seed()
  .catch((error) => {
    console.error("Error seeding data:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
