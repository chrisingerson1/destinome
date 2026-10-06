import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { z } from "zod";
import slugify from "slugify";

const csvPath = path.resolve("data/destinations.csv");

const raw = fs.readFileSync(csvPath, "utf8");

const rows = parse(raw, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
});

const optionalString = z
  .string()
  .transform((value) => value.trim())
  .transform((value) => (value === "" ? null : value));

const optionalNumber = z
  .string()
  .transform((value) => value.trim().replaceAll(",", ""))
  .transform((value, ctx) => {
    if (value === "") {
      return null;
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
      ctx.addIssue({
        code: "custom",
        message: `Expected number, received "${value}"`,
      });

      return z.NEVER;
    }

    return number;
  });

const optionalBoolean = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .transform((value, ctx) => {
    if (value === "") {
      return null;
    }

    if (["true", "yes", "1", "x"].includes(value)) {
      return true;
    }

    if (["false", "no", "0"].includes(value)) {
      return false;
    }

    ctx.addIssue({
      code: "custom",
      message: `Expected boolean, received "${value}"`,
    });

    return z.NEVER;
  });

const destinationRowSchema = z.object({
  source_id: z.string().min(1),

  name: z.string().min(1),
  country: z.string().min(1),

  admin_area_1: optionalString,
  admin_area_2: optionalString,

  continent_1: z.string().min(1),
  continent_2: optionalString,

  geo_subregion_1: optionalString,
  geo_subregion_2: optionalString,
  geo_subregion_3: optionalString,

  latitude: optionalNumber,
  longitude: optionalNumber,
  timezone: optionalString,

  elevation_m: optionalNumber,

  population: optionalNumber,
  population_year: optionalNumber,

  area_sq_km: optionalNumber,

  annual_tourists: optionalNumber,
  annual_tourists_year: optionalNumber,

  airline_hub: optionalBoolean,

  climate_code: optionalString,

  ideal_days_min: optionalNumber,
  ideal_days_max: optionalNumber,
});

const errors: string[] = [];
const destinations = [];

for (let index = 0; index < rows.length; index++) {
  const result = destinationRowSchema.safeParse(rows[index]);

  if (!result.success) {
    errors.push(
      `Row ${index + 2}: ${result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ")}`,
    );

    continue;
  }

  destinations.push(result.data);
}

const sourceIds = new Set<string>();
const duplicateSourceIds = new Set<string>();

for (const destination of destinations) {
  if (sourceIds.has(destination.source_id)) {
    duplicateSourceIds.add(destination.source_id);
  }

  sourceIds.add(destination.source_id);
}

console.log(`CSV rows: ${rows.length}`);
console.log(`Valid destinations: ${destinations.length}`);
console.log(`Invalid destinations: ${errors.length}`);
console.log(`Duplicate source IDs: ${duplicateSourceIds.size}`);

if (duplicateSourceIds.size > 0) {
  console.log("Duplicate source IDs:", [...duplicateSourceIds].join(", "));
}

if (errors.length > 0) {
  console.log("\nValidation errors:");

  for (const error of errors.slice(0, 50)) {
    console.log(`- ${error}`);
  }

  if (errors.length > 50) {
    console.log(`...and ${errors.length - 50} more`);
  }

  process.exitCode = 1;
}

const slugs = new Map<string, string[]>();

for (const destination of destinations) {
  const slug = slugify(
    [destination.name, destination.admin_area_1, destination.country]
      .filter(Boolean)
      .join(" "),
    {
      lower: true,
      strict: true,
    },
  );

  const existing = slugs.get(slug) ?? [];

  existing.push(destination.source_id);

  slugs.set(slug, existing);
}

const duplicateSlugs = [...slugs.entries()].filter(
  ([, sourceIds]) => sourceIds.length > 1,
);

console.log(`Duplicate generated slugs: ${duplicateSlugs.length}`);

for (const [slug, sourceIds] of duplicateSlugs) {
  console.log(`- ${slug}: ${sourceIds.join(", ")}`);
}
