import type { StyleSpecification } from "@maptiler/sdk";

// This style has no remote tiles, fonts, or sprites. Pins use Destinome's API.
export function createMinimalMapStyle(): StyleSpecification {
  return {
    version: 8,
    name: "Destinome without satellite imagery",
    projection: { type: "globe" },
    sources: {},
    layers: [
      {
        id: "minimal-globe-background",
        type: "background",
        paint: { "background-color": "#172337" },
      },
    ],
  };
}
