import { discoverySearch } from "./discovery.ts";
import type { DestinationScore } from "../types/scoring.ts";

export type ComparisonCategory = { slug: string; name: string };

const CATEGORY_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function comparisonHref(destinationSlug: string): string {
  const params = new URLSearchParams({ destination: destinationSlug });
  return `/compare${discoverySearch(params)}`;
}

export function updatePrimaryDestination(params: URLSearchParams, slug: string): URLSearchParams {
  const next = new URLSearchParams(params);
  const candidate = slug.trim();
  if (!candidate) return next;
  next.set("destination", candidate);
  return writeAdditionalDestinations(next, getAdditionalDestinationSlugs(next));
}

export function getAdditionalDestinationSlugs(params: URLSearchParams): string[] {
  const primary = params.get("destination")?.trim();
  if (!primary) return [];
  return [...new Set(params.getAll("with")
    .flatMap((value) => value.split(","))
    .map((slug) => slug.trim())
    .filter((slug) => slug && slug !== primary))].slice(0, 2);
}

function writeAdditionalDestinations(params: URLSearchParams, slugs: readonly string[]): URLSearchParams {
  const next = new URLSearchParams(params);
  next.delete("third");
  if (slugs.length) next.set("with", slugs.join(","));
  else next.delete("with");
  return next;
}

export function updateAdditionalDestination(params: URLSearchParams, index: 0 | 1, slug: string | null): URLSearchParams {
  const slugs = getAdditionalDestinationSlugs(params);
  const candidate = slug?.trim();
  const primary = params.get("destination")?.trim();
  if (!candidate) slugs.splice(index, 1);
  else if (primary && candidate !== primary && !slugs.some((value, position) => position !== index && value === candidate)) {
    slugs.splice(index, 1, candidate);
  }
  return writeAdditionalDestinations(params, slugs);
}

export function getSecondaryDestinationSlug(params: URLSearchParams): string | undefined {
  return getAdditionalDestinationSlugs(params)[0];
}

export function updateSecondaryDestination(params: URLSearchParams, slug: string | null): URLSearchParams {
  return updateAdditionalDestination(params, 0, slug);
}

export function getThirdDestinationSlug(params: URLSearchParams): string | undefined {
  return getAdditionalDestinationSlugs(params)[1];
}

export function updateThirdDestination(params: URLSearchParams, slug: string | null): URLSearchParams {
  return updateAdditionalDestination(params, 1, slug);
}

export function getComparisonCategories(params: URLSearchParams): string[] {
  return [...new Set((params.get("categories") ?? "")
    .split(",")
    .map((slug) => slug.trim().toLowerCase())
    .filter((slug) => slug !== "overall" && CATEGORY_SLUG.test(slug)))];
}

export function updateComparisonCategories(params: URLSearchParams, slugs: readonly string[]): URLSearchParams {
  const next = new URLSearchParams(params);
  const selected = getComparisonCategories(new URLSearchParams({ categories: slugs.join(",") }));
  if (selected.length) next.set("categories", selected.join(","));
  else next.delete("categories");
  return next;
}

export function getComparisonCategoryOptions(...groups: (readonly DestinationScore[] | undefined)[]): ComparisonCategory[] {
  const categories = new Map<string, ComparisonCategory>();
  for (const group of groups) {
    for (const { slug, name } of group ?? []) {
      if (slug !== "overall" && !categories.has(slug)) categories.set(slug, { slug, name });
    }
  }
  return [...categories.values()].sort((a, b) => a.name.localeCompare(b.name, "und"));
}

export function getComparisonScore(scores: readonly DestinationScore[] | undefined, slug: string): number | null {
  const score = scores?.find((entry) => entry.slug === slug)?.score;
  return typeof score === "number" && Number.isFinite(score) && score >= 0 && score <= 10 ? score : null;
}
