export const MAP_UNAVAILABLE_MESSAGE =
  "The map service is temporarily unavailable.";

export function getMapErrorMessage(error: unknown, hasLoaded: boolean): string | null {
  if (!hasLoaded) return MAP_UNAVAILABLE_MESSAGE;

  // A blocked tile request can also happen after the map has loaded.
  // Other individual tile failures should not hide a working map.
  if (typeof error !== "object" || error === null) return null;
  const { status, url } = error as { status?: unknown; url?: unknown };
  if (typeof status !== "number" || ![401, 403, 429].includes(status) || typeof url !== "string") return null;
  try {
    return ["api.maptiler.com", "tiles.openfreemap.org"].includes(new URL(url).hostname)
      ? MAP_UNAVAILABLE_MESSAGE : null;
  } catch {
    return null;
  }
}
