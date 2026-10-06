import { pool } from "../db.js";

import { seedContinents } from "./continents.js";
import { seedCountries } from "./countries.js";
import { seedClimateClassifications } from "./climate-classifications.js";
import { seedDestinationTypes } from "./destination-types.js";
import { seedTags } from "./tags.js";

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
