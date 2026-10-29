import assert from "node:assert/strict";
import { test } from "node:test";
import { InvalidScoreFilterError, parseScoreParams } from "../src/utils/parseScoreParams.js";

test("omitted or empty scores mean no filters", () => {
  assert.deepEqual(parseScoreParams(undefined), []);
  assert.deepEqual(parseScoreParams(""), []);
});

test("parses multiple filters, decimal thresholds, boundaries, and normalized slugs", () => {
  assert.deepEqual(parseScoreParams(" Food : 0, nature:10,public-transit:7.5"), [
    { slug: "food", min: 0 },
    { slug: "nature", min: 10 },
    { slug: "public-transit", min: 7.5 },
  ]);
});

test("rejects malformed score filters", () => {
  for (const input of [
    "food", "food:", "food: ", ":8", "food:8:9", "food:-1", "food:10.1",
    "food:NaN", "food:Infinity", "food:abc", "food:0x8", "food:1e0",
    "food:8,", ",food:8", "food:8,,nature:7", " ", "food!:8",
  ]) {
    assert.throws(() => parseScoreParams(input), InvalidScoreFilterError, input);
  }
});
