import { db } from "../db.js";
import { continents } from "../schema/geography.js";

const continentData = [
  { name: "Africa", slug: "africa" },
  { name: "Antarctica", slug: "antarctica" },
  { name: "Asia", slug: "asia" },
  { name: "Europe", slug: "europe" },
  { name: "North America", slug: "north-america" },
  { name: "Oceania", slug: "oceania" },
  { name: "South America", slug: "south-america" },
];

export async function seedContinents() {
  await db.insert(continents).values(continentData).onConflictDoNothing();

  console.log(`Seeded ${continentData.length} continents.`);
}
