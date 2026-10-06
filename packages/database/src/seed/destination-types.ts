import { db } from "../db.js";
import { destinationTypes } from "../schema/classifications.js";

const destinationTypeData = [
  { name: "Adventure", slug: "adventure" },
  { name: "All-inclusive", slug: "all-inclusive" },
  { name: "Beach", slug: "beach" },
  { name: "City", slug: "city" },
  { name: "Countryside", slug: "countryside" },
  { name: "Cultural", slug: "cultural" },
  { name: "Desert", slug: "desert" },
  { name: "Forest", slug: "forest" },
  { name: "Historical", slug: "historical" },
  { name: "Island", slug: "island" },
  { name: "Lake", slug: "lake" },
  { name: "Mountains", slug: "mountains" },
  { name: "Other", slug: "other" },
  { name: "Resort", slug: "resort" },
  { name: "River", slug: "river" },
  { name: "Safari", slug: "safari" },
  { name: "Wellness", slug: "wellness" },
];

export async function seedDestinationTypes() {
  await db
    .insert(destinationTypes)
    .values(destinationTypeData)
    .onConflictDoNothing();

  console.log(`Seeded ${destinationTypeData.length} destination types.`);
}
