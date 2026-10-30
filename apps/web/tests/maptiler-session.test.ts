import assert from "node:assert/strict";
import { test } from "node:test";
import { Map, config, type RequestTransformFunction } from "@maptiler/sdk";

test("the installed SDK attaches one shared session to MapTiler style and tile requests", async () => {
  assert.equal(config.session, true);
  const originalKey = config.apiKey;
  const originalCaching = config.caching;
  config.apiKey = "test-key";
  config.caching = false;
  try {
    // Capture the real SDK request pipeline without a DOM/WebGL map or network I/O.
    const map = Object.create(Map.prototype) as Map;
    let transform: RequestTransformFunction | undefined;
    Object.defineProperty(map, "_requestManager", {
      value: { setTransformRequest: (fn: RequestTransformFunction) => { transform = fn; } },
    });
    map.setTransformRequest((url) => ({ url }));
    assert.ok(transform);
    const session = map.getMaptilerSessionId();
    assert.ok(session);
    for (const path of ["maps/hybrid-v4/style.json", "tiles/satellite-v2/0/0/0.jpg", "fonts/test/0-255.pbf"]) {
      const result: Awaited<ReturnType<RequestTransformFunction>> = await transform(`https://api.maptiler.com/${path}`);
      assert.ok(result);
      const url: URL = new URL(result.url);
      assert.equal(url.searchParams.get("key"), "test-key");
      assert.deepEqual(url.searchParams.getAll("mtsid"), [session]);
    }
    const externalUrl = "https://example.org/tiles/0/0/0.png";
    assert.equal((await transform(externalUrl))?.url, externalUrl);
  } finally {
    config.apiKey = originalKey;
    config.caching = originalCaching;
  }
});
