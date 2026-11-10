import { sql, type SQLWrapper } from "drizzle-orm";

const COMBINING_ACCENTS = "[\u0300-\u036f]";
const MAX_SEARCH_LENGTH = 200;
const MAX_SEARCH_TERMS = 12;
const MAX_SEARCH_PATTERNS = 32;

export class InvalidSearchError extends Error {}

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

export function getSearchPatterns(input: unknown): string[] {
  if (typeof input !== "string") {
    throw new InvalidSearchError("Search must be a single string");
  }
  if (input.length > MAX_SEARCH_LENGTH) {
    throw new InvalidSearchError(`Search must be at most ${MAX_SEARCH_LENGTH} characters`);
  }

  const terms = normalizeSearchText(input)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

  if (terms.length > MAX_SEARCH_TERMS) {
    throw new InvalidSearchError(`Search must contain at most ${MAX_SEARCH_TERMS} words`);
  }

  if (terms.length === 0) {
    return [];
  }

  let combinations: string[][] = [[]];

  for (const term of terms) {
    const variants = Object.hasOwn(tokenAliases, term) ? tokenAliases[term] : [term];

    // Reject before allocating the next expansion, not after it has grown.
    if (combinations.length * variants.length > MAX_SEARCH_PATTERNS) {
      throw new InvalidSearchError("Search is too complex; use fewer words");
    }

    combinations = combinations.flatMap((combo) =>
      variants.map((variant) => [...combo, variant]),
    );
  }

  return combinations.map((combo) => `${combo.join("%")}%`);
}
