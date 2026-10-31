import { sql, type SQLWrapper } from "drizzle-orm";

const COMBINING_ACCENTS = "[\u0300-\u036f]";

export function normalizeSearchText(input: string): string {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// Match the same Unicode decomposition used by the search input, without an
// extension or changes to stored destination names.
export function stripSearchAccents(value: SQLWrapper) {
  return sql<string>`regexp_replace(normalize(${value}, NFD), ${COMBINING_ACCENTS}, '', 'g')`;
}

const tokenAliases: Record<string, string[]> = {
  saint: ["saint", "st"],
  st: ["st", "saint"],

  mount: ["mount", "mt"],
  mt: ["mt", "mount"],

  fort: ["fort", "ft"],
  ft: ["ft", "fort"],
};

export function getSearchPatterns(input: string) {
  const terms = normalizeSearchText(input)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

  if (terms.length === 0) {
    return [];
  }

  let combinations: string[][] = [[]];

  for (const term of terms) {
    const variants = tokenAliases[term] ?? [term];

    combinations = combinations.flatMap((combo) =>
      variants.map((variant) => [...combo, variant]),
    );
  }

  return combinations.map((combo) => `${combo.join("%")}%`);
}
