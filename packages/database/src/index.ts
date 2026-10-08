export { db, pool } from "./db.js";
export {
  destinationsContinents,
  destinationsDestinationTypes,
  destinationsGeoSubregions,
  destinationTypes,
} from "./schema/classifications.js";
export {
  destinationsKnownFor,
  knownFor,
  placesToVisit,
} from "./schema/content.js";
export { destinations } from "./schema/destinations.js";
export {
  administrativeAreas,
  climateClassifications,
  continents,
  countries,
  geoSubregions,
} from "./schema/geography.js";
export { destinationMonthlyMetrics } from "./schema/monthly.js";
export { destinationTagScores, tags } from "./schema/scoring.js";
