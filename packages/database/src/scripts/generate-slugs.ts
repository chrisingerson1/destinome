import slugify from "slugify";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db, pool } from "../db.js";

import { destinations } from "../schema/destinations.js";
import { administrativeAreas, countries } from "../schema/geography.js";
import { destinationTagScores, tags } from "../schema/scoring.js";

type DestinationForSlug = {
  id: number;
  sourceId: string;
  name: string;
  iso2: string;
  adminArea1: string | null;
  overallScore: number | null;
};

function toSlug(value: string) {
  return slugify(value, { lower: true, strict: true, trim: true });
}

function compareDestinations(a: DestinationForSlug, b: DestinationForSlug) {
  const scoreDifference = (b.overallScore ?? -1) - (a.overallScore ?? -1);
  if (scoreDifference !== 0) {
    return scoreDifference;
  }

  return a.sourceId.localeCompare(b.sourceId, undefined, { numeric: true });
}

async function generateSlugs() {
  const [overallTag] = await db
    .select({
      id: tags.id,
    })
    .from(tags)
    .where(eq(tags.slug, "overall"));

  if (!overallTag) {
    throw new Error("Could not find 'overall' tag.");
  }

  const currentAdminArea = alias(administrativeAreas, "current_admin_area");
  const parentAdminArea = alias(administrativeAreas, "parent_admin_area");

  const destinationRows = await db
    .select({
      id: destinations.id,
      sourceId: destinations.sourceId,
      name: destinations.name,

      iso2: countries.iso2,

      currentAdminName: currentAdminArea.name,
      currentAdminLevel: currentAdminArea.level,
      parentAdminName: parentAdminArea.name,
    })
    .from(destinations)
    .innerJoin(countries, eq(countries.id, destinations.countryId))
    .leftJoin(
      currentAdminArea,
      eq(currentAdminArea.id, destinations.administrativeAreaId),
    )
    .leftJoin(
      parentAdminArea,
      eq(parentAdminArea.id, currentAdminArea.parentId),
    );

  const overallScoreRows = await db
    .select({
      destinationId: destinationTagScores.destinationId,
      score: destinationTagScores.score,
    })
    .from(destinationTagScores)
    .where(eq(destinationTagScores.tagId, overallTag.id));

  const overallScoreByDestinationId = new Map(
    overallScoreRows.map((row) => [row.destinationId, row.score]),
  );

  const rows: DestinationForSlug[] = destinationRows.map((row) => {
    let adminArea1: string | null = null;

    if (row.currentAdminLevel === 1) {
      adminArea1 = row.currentAdminName;
    } else if (row.currentAdminLevel === 2) {
      adminArea1 = row.parentAdminName;
    }

    return {
      id: row.id,
      sourceId: row.sourceId,
      name: row.name,
      iso2: row.iso2?.toLowerCase(),
      adminArea1,
      overallScore: overallScoreByDestinationId.get(row.id) ?? null,
    };
  });

  const groups = new Map<string, DestinationForSlug[]>();

  for (const destination of rows) {
    const citySlug = toSlug(destination.name);
    const group = groups.get(citySlug) ?? [];

    group.push(destination);
    groups.set(citySlug, group);
  }

  const slugByDestinationId = new Map<number, string>();

  for (const [citySlug, group] of groups) {
    // No conflict
    if (group.length === 1) {
      slugByDestinationId.set(group[0].id, citySlug);
      continue;
    }

    // Group remaining conflicts by country
    const byCountry = new Map<string, DestinationForSlug[]>();

    for (const destination of group) {
      const countryGroup = byCountry.get(destination.iso2) ?? [];
      countryGroup.push(destination);
      byCountry.set(destination.iso2, countryGroup);
    }

    // If city name exists in multiple countries, highest overall score globally gets the clean slug
    //
    // If every destination is in the same country,
    // nobody gets the clean city slug because admin1 is the meaningful descriptor for uniqueness
    let globalWinner: DestinationForSlug | null = null;

    if (byCountry.size > 1) {
      globalWinner = [...group].sort(compareDestinations)[0];

      slugByDestinationId.set(globalWinner.id, citySlug);
    }

    for (const [iso2, countryGroup] of byCountry) {
      const remaining = countryGroup.filter(
        (destination) => destination.id !== globalWinner?.id,
      );
      if (remaining.length === 0) {
        continue;
      }

      // If there is only one destination with this city name in this country
      // Exception: US or Canada, use state/province
      if (countryGroup.length === 1) {
        const destination = remaining[0];

        const useAdminArea =
          ["us", "ca"].includes(iso2) && destination.adminArea1;
        const suffix = useAdminArea ? toSlug(destination.adminArea1!) : iso2;

        slugByDestinationId.set(destination.id, `${citySlug}-${suffix}`);
        continue;
      }

      // Multiple destinations share the same city name within this country
      const usedSlugs = new Set<string>();

      for (const destination of remaining) {
        let candidate: string;

        if (destination.adminArea1) {
          candidate = `${citySlug}-${toSlug(destination.adminArea1)}`;
        } else {
          candidate = `${citySlug}-${iso2}`;
        }

        // Defensive fallback
        if (
          usedSlugs.has(candidate) ||
          [...slugByDestinationId.values()].includes(candidate)
        ) {
          candidate = `${candidate}-${destination.sourceId}`;
        }

        usedSlugs.add(candidate);

        slugByDestinationId.set(destination.id, candidate);
      }
    }
  }

  // Final global uniqueness check
  const slugOwners = new Map<string, number>();

  for (const [destinationId, slug] of slugByDestinationId) {
    const existing = slugOwners.get(slug);
    if (existing !== undefined) {
      throw new Error(
        `Generated duplicate slug "${slug}" for destination IDs ${existing} and ${destinationId}`,
      );
    }

    slugOwners.set(slug, destinationId);
  }

  console.log(`Generated ${slugByDestinationId.size} unique slugs.`);

  await db.transaction(async (tx) => {
    // Temporarily free every existing slug
    for (const destination of rows) {
      await tx
        .update(destinations)
        .set({ slug: `temp-${destination.id}` })
        .where(eq(destinations.id, destination.id));
    }

    // Assign final slugs
    for (const destination of rows) {
      const slug = slugByDestinationId.get(destination.id);
      if (!slug) {
        throw new Error(`Missing slug for destination ${destination.id}`);
      }

      await tx
        .update(destinations)
        .set({ slug })
        .where(eq(destinations.id, destination.id));
    }
  });

  console.log("Destination slugs updated.");
}

generateSlugs()
  .catch((error) => {
    console.error("Error generating slugs:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
