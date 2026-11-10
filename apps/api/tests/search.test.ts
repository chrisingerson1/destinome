import assert from "node:assert/strict";
import { test } from "node:test";
import { getSearchPatterns, InvalidSearchError, normalizeSearchText } from "../src/utils/search.js";

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
  assert.deepEqual(getSearchPatterns("Mt. Fuji"), ["mt%fuji%", "mount%fuji%"]);
  assert.deepEqual(getSearchPatterns("Fort Worth"), ["fort%worth%", "ft%worth%"]);
  assert.deepEqual(getSearchPatterns("constructor"), ["constructor%"]);
});

test("search accepts length and word-count boundaries and rejects excess before normalization", () => {
  assert.deepEqual(getSearchPatterns("a".repeat(200)), [`${"a".repeat(200)}%`]);
  const words = Array(12).fill("paris");
  assert.deepEqual(getSearchPatterns(words.join(" ")), [`${words.join("%")}%`]);
  assert.deepEqual(getSearchPatterns(" ".repeat(200)), []);
  for (const input of ["a".repeat(201), " ".repeat(201), Array(13).fill("paris").join(" ")]) {
    assert.throws(() => getSearchPatterns(input), InvalidSearchError);
  }
});

test("search permits 32 alias combinations and rejects further expansion", () => {
  const patterns = getSearchPatterns("st st st st st Paris");
  assert.equal(patterns.length, 32);
  assert.equal(new Set(patterns).size, 32);
  assert.ok(patterns.every((pattern) => pattern.endsWith("%paris%")));
  assert.throws(() => getSearchPatterns("st st st st st st"), InvalidSearchError);
  assert.throws(() => getSearchPatterns(Array(12).fill("st").join(" ")), InvalidSearchError);
});

test("search rejects non-string inputs", () => {
  for (const input of [["Paris", "London"], {}, null, 12]) {
    assert.throws(() => getSearchPatterns(input), InvalidSearchError);
  }
});
