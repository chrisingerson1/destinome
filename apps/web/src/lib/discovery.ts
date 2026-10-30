import type { MapDestination } from "../types/destination";

export type ScoreFilter = { slug: string; min: number };

export type MapView = {
  longitude: number;
  latitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
};

export type DiscoveryState = {
  filters: ScoreFilter[];
  category: string;
  page: number;
  view: MapView | null;
};

export const DEFAULT_MAP_VIEW: MapView = {
  longitude: 0,
  latitude: 35,
  zoom: 2.5,
  bearing: 0,
  pitch: 0,
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DECIMAL = /^(?:\d+(?:\.\d*)?|\.\d+)$/;

export function readDiscoveryState(params: URLSearchParams): DiscoveryState {
  const filters = new Map<string, number>();
  for (const entry of (params.get("scores") ?? "").split(",")) {
    const parts = entry.split(":");
    const slug = parts[0]?.trim().toLowerCase();
    const value = parts[1]?.trim() ?? "";
    const min = Number(value);
    if (
      parts.length === 2 &&
      SLUG.test(slug) &&
      DECIMAL.test(value) &&
      min >= 0 &&
      min <= 10
    ) {
      // Duplicate minimums have the same meaning as their strictest threshold.
      filters.set(slug, Math.max(filters.get(slug) ?? 0, min));
    }
  }

  const category = params.get("category")?.trim().toLowerCase() ?? "overall";
  const page = Number(params.get("page") ?? 1);
  const parts = params.get("view")?.split(",");
  const numbers = parts?.map(Number);
  let view: MapView | null = null;
  if (
    parts?.length === 5 &&
    parts.every((part) => part.trim() !== "") &&
    numbers?.every(Number.isFinite)
  ) {
    const [longitude, latitude, zoom, bearing, pitch] = numbers;
    if (
      longitude >= -180 &&
      longitude <= 180 &&
      latitude >= -90 &&
      latitude <= 90 &&
      zoom >= -2 &&
      zoom <= 22 &&
      bearing >= -180 &&
      bearing <= 180 &&
      pitch >= 0 &&
      pitch <= 60
    ) {
      view = { longitude, latitude, zoom, bearing, pitch };
    }
  }

  return {
    filters: [...filters]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([slug, min]) => ({ slug, min })),
    category: SLUG.test(category) ? category : "overall",
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    view,
  };
}

export function mapViewKey(view: MapView): string {
  return [
    view.longitude.toFixed(5),
    view.latitude.toFixed(5),
    view.zoom.toFixed(3),
    view.bearing.toFixed(2),
    view.pitch.toFixed(2),
  ]
    .map(Number)
    .join(",");
}

export function updateDiscoveryParams(
  current: URLSearchParams,
  patch: Partial<DiscoveryState>,
): URLSearchParams {
  const state = { ...readDiscoveryState(current), ...patch };
  if (patch.filters !== undefined) state.page = 1;
  const params = new URLSearchParams(current);
  for (const key of ["scores", "category", "page", "view"]) params.delete(key);
  if (state.filters.length)
    params.set(
      "scores",
      state.filters.map(({ slug, min }) => `${slug}:${min}`).join(","),
    );
  if (state.category !== "overall") params.set("category", state.category);
  if (state.page !== 1) params.set("page", String(state.page));
  if (state.view) params.set("view", mapViewKey(state.view));
  return params;
}

export function matchesScoreFilters(
  filters: readonly ScoreFilter[],
  scores: Readonly<Record<string, number | null>>,
): boolean {
  return filters.every(({ slug, min }) => {
    const score = scores[slug];
    return typeof score === "number" && Number.isFinite(score) && score >= min;
  });
}

export function rankedMapDestinations(
  destinations: readonly MapDestination[],
  matchingIds: ReadonlySet<number> | null,
): MapDestination[] {
  return destinations
    .filter(({ id }) => matchingIds === null || matchingIds.has(id))
    .sort((a, b) => {
      if (a.overallScore !== b.overallScore) {
        if (a.overallScore === null) return 1;
        if (b.overallScore === null) return -1;
        return b.overallScore - a.overallScore;
      }
      return a.name.localeCompare(b.name, "und") || a.id - b.id;
    });
}

export function discoverySearch(params: URLSearchParams): string {
  // Keep discovery separators readable without decoding query delimiters or
  // changing the encoding of unrelated parameters.
  const query = params.toString().replace(
    /(^|&)(scores|view)=([^&]*)/g,
    (_match, separator: string, key: string, value: string) =>
      `${separator}${key}=${value.replace(/%3A/gi, ":").replace(/%2C/gi, ",")}`,
  );
  return query ? `?${query}` : "";
}

export function discoveryHref(params: URLSearchParams): string {
  return `/map${discoverySearch(params)}`;
}

export function destinationHref(slug: string): string {
  return `/destination/${encodeURIComponent(slug)}`;
}
