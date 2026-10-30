import assert from "node:assert/strict";
import { test } from "node:test";
import { selectMapBasemap } from "../src/lib/mapBasemap.ts";

test("development uses OpenFreeMap without requiring an environment override", () => {
  assert.equal(selectMapBasemap(true), "openfreemap");
  assert.equal(selectMapBasemap(true, "openfreemap"), "openfreemap");
  assert.equal(selectMapBasemap(true, "typo"), "openfreemap");
});

test("development can explicitly exercise MapTiler or the local fallback", () => {
  assert.equal(selectMapBasemap(true, "maptiler"), "maptiler");
  assert.equal(selectMapBasemap(true, "minimal"), "minimal");
});

test("production always uses MapTiler regardless of development overrides", () => {
  for (const override of [undefined, "openfreemap", "minimal", "maptiler", "typo"]) {
    assert.equal(selectMapBasemap(false, override), "maptiler");
  }
});
