export type MapBasemap = "maptiler" | "openfreemap" | "minimal";

export const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export const getFallbackBasemap = (current: MapBasemap): MapBasemap =>
  current === "maptiler" ? "openfreemap" : "minimal";

export const selectMapBasemap = (
  isDevelopment: boolean,
  developmentOverride?: string,
): MapBasemap => {
  if (!isDevelopment) return "maptiler";
  if (developmentOverride === "maptiler" || developmentOverride === "minimal") {
    return developmentOverride;
  }
  return "openfreemap";
};
