import assert from "node:assert/strict";
import { test } from "node:test";
import { getSearchPatterns, normalizeSearchText } from "../src/utils/search.js";

test("accented, unaccented, and decomposed destination queries share search patterns", () => {
  for (const input of ["Bele", "Belé", "BELE\u0301"]) {
    assert.deepEqual(getSearchPatterns(input), ["bele%"]);
  }
  for (const input of ["Belém", "Belem", "Bele\u0301m"]) {
    assert.deepEqual(getSearchPatterns(input), ["belem%"]);
  }
  assert.deepEqual(getSearchPatterns("São Paulo"), ["sao%paulo%"]);
  assert.deepEqual(getSearchPatterns("MÜNCHEN"), ["munchen%"]);
});

test("search folding retains aliases, punctuation handling, and non-Latin names", () => {
  assert.deepEqual(getSearchPatterns("St. Étienne"), ["st%etienne%", "saint%etienne%"]);
  assert.deepEqual(getSearchPatterns("Saint-Étienne"), ["saint%etienne%", "st%etienne%"]);
  assert.deepEqual(getSearchPatterns("東京"), ["東京%"]);
  assert.deepEqual(getSearchPatterns("  %_!  "), []);
  assert.equal(normalizeSearchText("  BELÉM  "), "belem");
});
