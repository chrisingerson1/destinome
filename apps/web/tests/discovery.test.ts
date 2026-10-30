import assert from "node:assert/strict";
import { test } from "node:test";
import { createMemoryRouter } from "react-router";
import {
  destinationHref,
  discoveryHref,
  discoverySearch,
  mapViewKey,
  matchesScoreFilters,
  readDiscoveryState,
  updateDiscoveryParams,
} from "../src/lib/discovery.ts";

test("a direct map visit uses discovery defaults", () => {
  assert.deepEqual(readDiscoveryState(new URLSearchParams()), {
    filters: [],
    category: "overall",
    page: 1,
    view: null,
  });
});

test("map URLs display readable score and camera separators", () => {
  const encoded = "scores=overall%3A9.5%2Cbudget%3A8&category=budget&view=2.75971%2C47.01698%2C4.34%2C0%2C0";
  const readable = "/map?scores=overall:9.5,budget:8&category=budget&view=2.75971,47.01698,4.34,0,0";
  assert.equal(discoveryHref(new URLSearchParams(encoded)), readable);
  assert.deepEqual(
    readDiscoveryState(new URLSearchParams(encoded)),
    readDiscoveryState(new URL(readable, "https://destinome.test").searchParams),
  );
  assert.equal(discoverySearch(new URLSearchParams()), "");
});

test("readable separators preserve escaped delimiters and unrelated parameters", () => {
  const params = new URLSearchParams({
    scores: "food:8,budget:7&category=culture#fragment",
    view: "2,47,4,0,0",
    campaign: "launch:a,b &name=+value#fragment?%",
  });
  const search = discoverySearch(params);
  assert.match(search, /scores=food:8,budget:7%26category%3Dculture%23fragment/);
  assert.match(search, /campaign=launch%3Aa%2Cb/);
  assert.deepEqual([...new URLSearchParams(search)], [...params]);
});

test("readable router navigation supports replacing camera state and Back/Forward", async () => {
  const router = createMemoryRouter([{ path: "/map" }], {
    initialEntries: ["/map?scores=overall%3A9.5%2Cbudget%3A8&category=budget"],
  });
  try {
    const initial = new URLSearchParams(router.state.location.search);
    await router.navigate(discoveryHref(initial), { replace: true });
    assert.equal(router.state.location.search, "?scores=overall:9.5,budget:8&category=budget");
    const changed = updateDiscoveryParams(initial, { filters: [{ slug: "food", min: 8 }] });
    await router.navigate(discoveryHref(changed));
    const moved = updateDiscoveryParams(changed, {
      view: { longitude: 2.75971, latitude: 47.01698, zoom: 4.34, bearing: 0, pitch: 0 },
    });
    await router.navigate(discoveryHref(moved), { replace: true });
    assert.equal(router.state.location.search, "?scores=food:8&category=budget&view=2.75971,47.01698,4.34,0,0");
    await router.navigate(-1);
    assert.equal(router.state.location.search, "?scores=overall:9.5,budget:8&category=budget");
    await router.navigate(1);
    assert.equal(router.state.location.search, discoverySearch(moved));
  } finally {
    router.dispose();
  }
});

test("shared URLs restore filters, coloring, pagination, and the full camera", () => {
  const params = new URLSearchParams(
    "scores=food:8,nature:7.5&category=culture&page=3&view=-71.05888,42.36008,10.25,30,45",
  );
  const state = readDiscoveryState(params);
  assert.deepEqual(state, {
    filters: [
      { slug: "food", min: 8 },
      { slug: "nature", min: 7.5 },
    ],
    category: "culture",
    page: 3,
    view: {
      longitude: -71.05888,
      latitude: 42.36008,
      zoom: 10.25,
      bearing: 30,
      pitch: 45,
    },
  });
  assert.deepEqual(
    readDiscoveryState(updateDiscoveryParams(params, {})),
    state,
  );
});

test("malformed URL values fall back safely while retaining valid filters", () => {
  const state = readDiscoveryState(
    new URLSearchParams({
      scores:
        "food:8,nature:,culture:11,beaches:NaN,food:9,Food:7,walkability:0",
      category: "<invalid>",
      page: "-1",
      view: "NaN,0,5,0,0",
    }),
  );
  assert.deepEqual(state, {
    filters: [
      { slug: "food", min: 9 },
      { slug: "walkability", min: 0 },
    ],
    category: "overall",
    page: 1,
    view: null,
  });
  for (const view of [
    "",
    "1,2,3",
    "1,2,3,,0",
    "181,0,3,0,0",
    "0,91,3,0,0",
    "0,0,23,0,0",
    "0,0,3,181,0",
    "0,0,3,0,61",
  ]) {
    assert.equal(
      readDiscoveryState(new URLSearchParams({ view })).view,
      null,
      view,
    );
  }
});

test("camera and color updates preserve filters, page, and unrelated query parameters", () => {
  const original = new URLSearchParams("scores=food:8&page=4&campaign=shared");
  const view = {
    longitude: 12.1234567,
    latitude: 35,
    zoom: 6.12345,
    bearing: 12.345,
    pitch: 20,
  };
  const changed = updateDiscoveryParams(original, { category: "nature", view });
  assert.equal(changed.get("scores"), "food:8");
  assert.equal(changed.get("page"), "4");
  assert.equal(changed.get("campaign"), "shared");
  assert.equal(changed.get("category"), "nature");
  assert.equal(changed.get("view"), mapViewKey(view));
  assert.equal(original.get("category"), null);
});

test("changing or clearing filters resets pagination and preserves camera/color", () => {
  const original = new URLSearchParams(
    "scores=food:8&category=culture&page=4&view=0,35,2.5,0,0",
  );
  const changed = updateDiscoveryParams(original, {
    filters: [{ slug: "nature", min: 10 }],
  });
  assert.equal(changed.get("scores"), "nature:10");
  assert.equal(changed.get("page"), null);
  assert.equal(changed.get("category"), "culture");
  assert.equal(changed.get("view"), "0,35,2.5,0,0");
  const cleared = updateDiscoveryParams(changed, { filters: [] });
  assert.equal(cleared.get("scores"), null);
  assert.equal(readDiscoveryState(cleared).page, 1);
});

test("filters require every category, including rated zero values at a zero minimum", () => {
  const filters = [
    { slug: "food", min: 8 },
    { slug: "nature", min: 0 },
  ];
  assert.equal(matchesScoreFilters(filters, { food: 8, nature: 0 }), true);
  assert.equal(matchesScoreFilters(filters, { food: 7.99, nature: 10 }), false);
  assert.equal(matchesScoreFilters(filters, { food: 9, nature: null }), false);
  assert.equal(matchesScoreFilters(filters, { food: 9 }), false);
  assert.equal(matchesScoreFilters(filters, { food: NaN, nature: 10 }), false);
  assert.equal(matchesScoreFilters([], {}), true);
});

test("destination and neighborhood links contain only their slugs", () => {
  assert.equal(destinationHref("paris"), "/destination/paris");
  assert.equal(destinationHref("montmartre-paris"), "/destination/montmartre-paris");
});

test("plain map links do not add an empty query string", () => {
  assert.equal(discoveryHref(new URLSearchParams()), "/map");
});
