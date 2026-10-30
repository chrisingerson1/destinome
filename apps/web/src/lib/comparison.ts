import { discoverySearch } from "./discovery.ts";
import type { DestinationScore } from "../types/scoring.ts";

export type ComparisonCategory = { slug: string; name: string };

const CATEGORY_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function comparisonHref(destinationSlug: string): string {
  const params = new URLSearchParams({ destination: destinationSlug });
  return `/compare${discoverySearch(params)}`;
}

export function getSecondaryDestinationSlug(params: URLSearchParams): string | undefined {
  const primary = params.get("destination")?.trim();
  const secondary = params.get("with")?.trim();
  return primary && secondary && primary !== secondary ? secondary : undefined;
}

export function updateSecondaryDestination(params: URLSearchParams, slug: string | null): URLSearchParams {
  const next = new URLSearchParams(params);
  const candidate = slug?.trim();
  const primary = next.get("destination")?.trim();
  next.delete("with");
  if (primary && candidate && candidate !== primary) next.set("with", candidate);
  return next;
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
