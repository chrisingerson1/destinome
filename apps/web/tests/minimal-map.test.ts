import assert from "node:assert/strict";
import { test } from "node:test";
import { createMinimalMapStyle } from "../src/lib/minimalMapStyle.ts";

test("the minimal globe has a visible background and needs no external map resources", () => {
  const style = createMinimalMapStyle();
  assert.equal(style.version, 8);
  assert.deepEqual(style.projection, { type: "globe" });
  assert.deepEqual(style.sources, {});
  assert.equal(style.glyphs, undefined);
  assert.equal(style.sprite, undefined);
  assert.equal(style.layers.length, 1);
  assert.equal(style.layers[0].type, "background");
  assert.doesNotMatch(JSON.stringify(style), /https?:|maptiler|key=/i);
});

test("each minimal map attempt receives a fresh style for adding its pin layer", () => {
  const first = createMinimalMapStyle();
  first.layers.push({ id: "example-pin-layer", type: "background" });
  assert.equal(createMinimalMapStyle().layers.length, 1);
});
