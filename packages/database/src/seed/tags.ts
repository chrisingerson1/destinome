import { db } from "../db.js";
import { tags } from "../schema/scoring.js";

const tagData = [
  { name: "Activities", slug: "activities" },
  { name: "Architecture", slug: "architecture" },
  { name: "Beaches", slug: "beaches" },
  { name: "Boating", slug: "boating" },
  { name: "Budget", slug: "budget" },
  { name: "Camping", slug: "camping" },
  { name: "Culture", slug: "culture" },
  { name: "Cycling", slug: "cycling" },
  { name: "Disability-Friendly", slug: "disability-friendly" },
  { name: "Diving", slug: "diving" },
  { name: "Food", slug: "food" },
  { name: "Gambling", slug: "gambling" },
  { name: "Golf", slug: "golf" },
  { name: "Hiking", slug: "hiking" },
  { name: "Kid-Friendly", slug: "kid-friendly" },
  { name: "LGBT-Friendly", slug: "lgbt-friendly" },
  { name: "Museums", slug: "museums" },
  { name: "Nature", slug: "nature" },
  { name: "Nightlife", slug: "nightlife" },
  { name: "Overall", slug: "overall" },
  { name: "Photographic Hotspots", slug: "photographic-hotspots" },
  { name: "Public Transit", slug: "public-transit" },
  { name: "Romantic", slug: "romantic" },
  { name: "Safety", slug: "safety" },
  { name: "Scenery", slug: "scenery" },
  { name: "Shopping", slug: "shopping" },
  { name: "Sightseeing", slug: "sightseeing" },
  { name: "Ski", slug: "ski" },
  { name: "Walkability", slug: "walkability" },
  { name: "Wellness", slug: "wellness" },
  { name: "Wildlife", slug: "wildlife" },
  { name: "Winter Sports", slug: "winter-sports" },
  { name: "Women-Friendly", slug: "women-friendly" },
];

export async function seedTags() {
  await db.insert(tags).values(tagData).onConflictDoNothing();

  console.log(`Seeded ${tagData.length} tags.`);
}
