import assert from "node:assert/strict";
import { test } from "node:test";
import { createMemoryRouter } from "react-router";
import { createMapReturnStore, MAP_RETURN_STORAGE_KEY, parseMapReturnParams } from "../src/lib/mapReturn.ts";
import { discoverySearch, readDiscoveryState } from "../src/lib/discovery.ts";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

test("a new tab falls back to the plain map", () => {
  assert.equal(createMapReturnStore(() => memoryStorage()).getSnapshot(), "/map");
});

test("saved filters, pagination, camera, and fragments survive a page refresh", () => {
  const storage = memoryStorage();
  const store = createMapReturnStore(() => storage);
  const mapUrl = "/map?scores=food:8,nature:7&category=nature&page=2&view=2.75971,47.01698,4.34,20,40#places";
  store.save(mapUrl);
  const refreshed = createMapReturnStore(() => storage);
  assert.equal(refreshed.getSnapshot(), mapUrl);
  assert.equal(storage.getItem(MAP_RETURN_STORAGE_KEY), mapUrl);
  const state = readDiscoveryState(new URL(refreshed.getSnapshot(), "https://destinome.test").searchParams);
  assert.equal(state.filters.length, 2);
  assert.equal(state.page, 2);
  assert.equal(state.view?.longitude, 2.75971);
  assert.equal(state.view?.bearing, 20);
});

test("the most recent map replaces the previous tab return target", () => {
  const storage = memoryStorage();
  const store = createMapReturnStore(() => storage);
  store.save("/map?scores=food:8");
  store.save("/map?scores=nature:9");
  assert.equal(store.getSnapshot(), "/map?scores=nature:9");
  store.save("/map");
  assert.equal(createMapReturnStore(() => storage).getSnapshot(), "/map");
});

test("legacy links yield a valid map target and clean destination/comparison parameters", () => {
  const mapUrl = "/map?scores=food:8,budget:7&view=2,47,4,0,0&campaign=a%26b%2Fc+literal#places";
  const original = new URLSearchParams({ destination: "lisbon", with: "porto", returnTo: mapUrl, campaign: "shared" });
  const migrated = parseMapReturnParams(original);
  assert.equal(migrated.legacyMapUrl, mapUrl);
  assert.equal(migrated.params.has("returnTo"), false);
  assert.equal(discoverySearch(migrated.params), "?destination=lisbon&with=porto&campaign=shared");
  assert.equal(original.get("returnTo"), mapUrl);
  const storage = memoryStorage();
  createMapReturnStore(() => storage).save(migrated.legacyMapUrl!);
  assert.equal(createMapReturnStore(() => storage).getSnapshot(), mapUrl);
});

test("external or unrelated stored and legacy URLs cannot become map return links", () => {
  const storage = memoryStorage();
  for (const invalid of ["https://example.com/map", "//example.com/map", "/map/other", "/map.evil", "javascript:alert(1)"]) {
    storage.setItem(MAP_RETURN_STORAGE_KEY, invalid);
    const store = createMapReturnStore(() => storage);
    assert.equal(store.getSnapshot(), "/map");
    store.save("/map?category=food");
    store.save(invalid);
    assert.equal(store.getSnapshot(), "/map?category=food");
    const migration = parseMapReturnParams(new URLSearchParams({ returnTo: invalid }));
    assert.equal(migration.legacyMapUrl, undefined);
    assert.equal(migration.params.has("returnTo"), false);
  }
});

test("migrating an old comparison link preserves selections, fragments, and Back/Forward history", async () => {
  const mapUrl = "/map?scores=food:8&view=2,47,4,0,0#places";
  const legacySearch = new URLSearchParams({ destination: "lisbon", with: "porto", returnTo: mapUrl });
  const router = createMemoryRouter([{ path: "/map" }, { path: "/compare" }], {
    initialEntries: [mapUrl, `/compare?${legacySearch}#comparison`], initialIndex: 1,
  });
  try {
    const storage = memoryStorage();
    const store = createMapReturnStore(() => storage);
    const migrated = parseMapReturnParams(new URLSearchParams(router.state.location.search));
    assert.ok(migrated.legacyMapUrl);
    store.save(migrated.legacyMapUrl);
    await router.navigate({ search: discoverySearch(migrated.params), hash: router.state.location.hash }, { replace: true });
    assert.equal(router.state.location.search, "?destination=lisbon&with=porto");
    assert.equal(router.state.location.hash, "#comparison");
    assert.equal(createMapReturnStore(() => storage).getSnapshot(), mapUrl);
    await router.navigate(-1);
    assert.equal(router.state.location.pathname, "/map");
    await router.navigate(1);
    assert.equal(router.state.location.search, "?destination=lisbon&with=porto");
  } finally { router.dispose(); }
});

test("blocked storage does not break in-memory return navigation", () => {
  const denied = createMapReturnStore(() => { throw new Error("Storage denied"); });
  assert.equal(denied.getSnapshot(), "/map");
  denied.save("/map?category=nature");
  assert.equal(denied.getSnapshot(), "/map?category=nature");
  const cannotWrite = createMapReturnStore(() => ({
    getItem: () => "/map?category=food",
    setItem: () => { throw new Error("Storage full"); },
  }));
  cannotWrite.save("/map?category=budget");
  assert.equal(cannotWrite.getSnapshot(), "/map?category=budget");
});

test("return links react to changes and unsubscribe without duplicate updates", () => {
  const store = createMapReturnStore(() => undefined);
  let updates = 0;
  const unsubscribe = store.subscribe(() => { updates++; });
  store.save("/map?category=nature");
  assert.equal(updates, 1);
  store.save("/map?category=nature");
  assert.equal(updates, 1);
  unsubscribe();
  store.save("/map?category=food");
  assert.equal(updates, 1);
});
