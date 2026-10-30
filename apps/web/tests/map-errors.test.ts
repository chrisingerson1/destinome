import assert from "node:assert/strict";
import { test } from "node:test";
import { getMapErrorMessage, MAP_UNAVAILABLE_MESSAGE } from "../src/lib/mapErrors.ts";

test("initial map failures display an unavailable message without exposing provider error details", () => {
  for (const error of [new Error("Failed to fetch"), undefined, {
    status: 403,
    url: "https://api.maptiler.com/maps/hybrid-v4/style.json?key=private-value",
    message: "Invalid key",
  }]) {
    assert.equal(getMapErrorMessage(error, false), MAP_UNAVAILABLE_MESSAGE);
  }
});

test("provider authorization and quota failures also display after the map has loaded", () => {
  for (const status of [401, 403, 429]) {
    for (const host of ["api.maptiler.com", "tiles.openfreemap.org"]) {
      assert.equal(getMapErrorMessage({ status, url: `https://${host}/tiles/example/0/0/0.pbf` }, true), MAP_UNAVAILABLE_MESSAGE);
    }
  }
});

test("individual tile errors and unrelated requests do not hide a loaded map", () => {
  for (const error of [
    new Error("An individual tile failed"),
    { status: 404, url: "https://api.maptiler.com/tiles/missing.pbf" },
    { status: 403, url: "https://another-service.test/tile" },
    { status: 403, url: "https://api.maptiler.com.another-service.test/tile" },
    { status: 403, url: "https://tiles.openfreemap.org.another-service.test/tile" },
    { status: 403, url: "invalid-url" },
    { status: 403 },
    null,
  ]) assert.equal(getMapErrorMessage(error, true), null);
});
