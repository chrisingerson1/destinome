import assert from "node:assert/strict";
import { test } from "node:test";
import { getFallbackBasemap, selectMapBasemap } from "../src/lib/mapBasemap.ts";

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

test("an unavailable production MapTiler map falls back to OpenFreeMap", () => {
  assert.equal(getFallbackBasemap(selectMapBasemap(false)), "openfreemap");
  assert.equal(getFallbackBasemap(selectMapBasemap(true, "maptiler")), "openfreemap");
});

test("if OpenFreeMap also fails, subsequent attempts stay on the local map", () => {
  const fallback = getFallbackBasemap("maptiler");
  assert.equal(getFallbackBasemap(fallback), "minimal");
  assert.equal(getFallbackBasemap(selectMapBasemap(true)), "minimal");
  assert.equal(getFallbackBasemap("minimal"), "minimal");
});
