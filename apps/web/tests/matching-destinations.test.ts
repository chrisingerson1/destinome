import assert from "node:assert/strict";
import { test } from "node:test";
import { rankedMapDestinations } from "../src/lib/discovery.ts";
import type { MapDestination } from "../src/types/destination.ts";

const place = (id: number, name: string, overallScore: number | null): MapDestination => ({
  id, name, slug: `place-${id}`, overallScore,
  latitude: 0, longitude: 0, country: "France", parentDestinationId: null,
});

test("matching list ranks overall descending, missing scores last, then name and ID", () => {
  const destinations = [
    place(6, "Unrated", null), place(5, "Zero", 0), place(4, "Bravo", 9),
    place(2, "Alpha", 9), place(1, "Alpha", 9), place(3, "Highest", 10),
  ];
  assert.deepEqual(rankedMapDestinations(destinations, null).map(({ id }) => id), [3, 1, 2, 4, 5, 6]);
  assert.deepEqual(destinations.map(({ id }) => id), [6, 5, 4, 2, 1, 3]);
});

test("matching list includes exactly the visible pin IDs, including neighborhoods", () => {
  const city = place(1, "Paris", 9.5);
  const neighborhood = { ...place(2, "Montmartre", 8), parentDestinationId: city.id };
  const excluded = place(3, "Excluded", 10);
  const visibleIds = new Set([1, 2]);
  const results = rankedMapDestinations([neighborhood, excluded, city], visibleIds);
  assert.deepEqual(results.map(({ id }) => id), [1, 2]);
  assert.equal(results.length, visibleIds.size);
  assert.equal(results[1].parentDestinationId, city.id);
});

test("matching list is empty when no destinations pass the filters", () => {
  assert.deepEqual(rankedMapDestinations([place(1, "Paris", 9)], new Set()), []);
  assert.deepEqual(rankedMapDestinations([], null), []);
});
