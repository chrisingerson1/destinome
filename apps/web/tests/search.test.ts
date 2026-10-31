import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeSearchText } from "../src/lib/search.ts";

test("local search compares accented parent names and unaccented queries equally", () => {
  assert.equal(normalizeSearchText("Belém"), normalizeSearchText("Belem"));
  assert.equal(normalizeSearchText("Bele\u0301m"), normalizeSearchText("BELÉM"));
  assert.ok(normalizeSearchText("Belém").startsWith(normalizeSearchText("Bele")));
  assert.equal(normalizeSearchText("  São,  Paulo  "), "sao paulo");
  assert.ok(normalizeSearchText("São Paulo").startsWith(normalizeSearchText("Sao Pau")));
  assert.equal(normalizeSearchText("東京"), "東京");
});
