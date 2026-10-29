import assert from "node:assert/strict";
import { test } from "node:test";
import { destinationBaseSlug } from "../src/utils/slugs.js";

test("neighborhood slugs include their direct parent's name", () => {
  assert.equal(destinationBaseSlug("North End", "Boston"), "north-end-boston");
  assert.equal(destinationBaseSlug("West Village", "Manhattan"), "west-village-manhattan");
});

test("destinations without parents keep their existing base slug", () => {
  assert.equal(destinationBaseSlug("Boston", null), "boston");
  assert.equal(destinationBaseSlug("New York City", null), "new-york-city");
});

test("same-name neighborhoods under different parents get distinct base slugs", () => {
  assert.equal(destinationBaseSlug("Downtown", "Boston"), "downtown-boston");
  assert.equal(destinationBaseSlug("Downtown", "Austin"), "downtown-austin");
});

test("both neighborhood and parent names use the existing slug normalization", () => {
  assert.equal(destinationBaseSlug("Île Saint-Louis", "Paris"), "ile-saint-louis-paris");
  assert.equal(destinationBaseSlug("Centro Histórico", "São Paulo"), "centro-historico-sao-paulo");
});
