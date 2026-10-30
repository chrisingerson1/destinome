import assert from "node:assert/strict";
import { test } from "node:test";
import { createMemoryRouter } from "react-router";
import {
  comparisonHref,
  getComparisonCategories,
  getComparisonCategoryOptions,
  getComparisonScore,
  getSecondaryDestinationSlug,
  updateComparisonCategories,
  updateSecondaryDestination,
} from "../src/lib/comparison.ts";
import { destinationHref, discoverySearch } from "../src/lib/discovery.ts";
import { createMapReturnStore } from "../src/lib/mapReturn.ts";

test("comparison links preload the destination and work without saved map settings", () => {
  assert.equal(comparisonHref("north-end-boston"), "/compare?destination=north-end-boston");
  const params = new URL(comparisonHref("north-end-boston"), "https://destinome.test").searchParams;
  assert.equal(params.get("destination"), "north-end-boston");
  assert.equal(params.has("returnTo"), false);
});

test("details and comparison links stay clean while map settings survive a refresh", () => {
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
  const session = createMapReturnStore(() => storage);
  const mapUrl = "/map?scores=food:8,budget:7&category=food&page=2&view=2,47,4,0,0";
  session.save(mapUrl);
  const detailsUrl = new URL(destinationHref("lisbon"), "https://destinome.test");
  const compareUrl = new URL(comparisonHref("lisbon"), detailsUrl);
  assert.equal(detailsUrl.search, "");
  assert.equal(compareUrl.pathname, "/compare");
  assert.equal(compareUrl.searchParams.get("destination"), "lisbon");
  assert.equal(compareUrl.searchParams.has("returnTo"), false);
  const refreshedSession = createMapReturnStore(() => storage);
  assert.equal(refreshedSession.getSnapshot(), mapUrl);
  const backToDetails = new URL(destinationHref(compareUrl.searchParams.get("destination")!), compareUrl);
  assert.equal(backToDetails.href, detailsUrl.href);
});

test("a shared comparison still identifies both destinations without the sender's map session", () => {
  const params = updateSecondaryDestination(new URLSearchParams({ destination: "lisbon" }), "porto");
  assert.equal(`/compare${discoverySearch(params)}`, "/compare?destination=lisbon&with=porto");
  assert.equal(getSecondaryDestinationSlug(params), "porto");
  assert.equal(createMapReturnStore(() => undefined).getSnapshot(), "/map");
});

test("adding, replacing, and removing a comparison keeps the original destination and other parameters", () => {
  const original = new URL(comparisonHref("lisbon"), "https://destinome.test").searchParams;
  original.set("campaign", "shared");
  const added = updateSecondaryDestination(original, "barcelona");
  assert.equal(getSecondaryDestinationSlug(added), "barcelona");
  assert.equal(added.get("destination"), "lisbon");
  assert.equal(added.has("returnTo"), false);
  assert.equal(added.get("campaign"), "shared");
  assert.equal(original.has("with"), false);
  const replaced = updateSecondaryDestination(added, "porto");
  assert.equal(getSecondaryDestinationSlug(replaced), "porto");
  const removed = updateSecondaryDestination(replaced, null);
  assert.equal(getSecondaryDestinationSlug(removed), undefined);
  assert.equal(removed.get("destination"), "lisbon");
  assert.equal(removed.has("returnTo"), false);
});

test("a comparison cannot select the original destination or exist without one", () => {
  const original = new URLSearchParams({ destination: "lisbon" });
  assert.equal(updateSecondaryDestination(original, "lisbon").has("with"), false);
  assert.equal(getSecondaryDestinationSlug(new URLSearchParams("destination=lisbon&with=lisbon")), undefined);
  assert.equal(getSecondaryDestinationSlug(new URLSearchParams("with=porto")), undefined);
  assert.equal(updateSecondaryDestination(new URLSearchParams(), "porto").has("with"), false);
});

test("shared comparison URLs and browser history restore both destinations", async () => {
  const router = createMemoryRouter([{ path: "/compare" }], {
    initialEntries: [comparisonHref("lisbon")],
  });
  try {
    const params = new URLSearchParams(router.state.location.search);
    const selected = updateSecondaryDestination(params, "barcelona");
    await router.navigate({ search: discoverySearch(selected) });
    assert.equal(getSecondaryDestinationSlug(new URLSearchParams(router.state.location.search)), "barcelona");
    const shared = new URL(router.state.location.pathname + router.state.location.search, "https://destinome.test");
    assert.equal(shared.searchParams.get("destination"), "lisbon");
    assert.equal(getSecondaryDestinationSlug(shared.searchParams), "barcelona");
    const cleared = updateSecondaryDestination(shared.searchParams, null);
    await router.navigate({ search: discoverySearch(cleared) });
    await router.navigate(-1);
    assert.equal(getSecondaryDestinationSlug(new URLSearchParams(router.state.location.search)), "barcelona");
    await router.navigate(-1);
    assert.equal(getSecondaryDestinationSlug(new URLSearchParams(router.state.location.search)), undefined);
    await router.navigate(1);
    assert.equal(getSecondaryDestinationSlug(new URLSearchParams(router.state.location.search)), "barcelona");
  } finally { router.dispose(); }
});

test("comparison categories start empty and parse unique valid slugs in selection order", () => {
  assert.deepEqual(getComparisonCategories(new URLSearchParams("scores=food:8&category=food")), []);
  const params = new URLSearchParams({ categories: " Food, budget,food,overall,,bad_slug,-bad,nature " });
  assert.deepEqual(getComparisonCategories(params), ["food", "budget", "nature"]);
});

test("category changes preserve destinations and unrelated URL settings without mutating inputs", () => {
  const original = new URLSearchParams("destination=lisbon&with=porto&campaign=shared");
  const added = updateComparisonCategories(original, ["food", "budget", "food", "overall"]);
  assert.equal(discoverySearch(added), "?destination=lisbon&with=porto&campaign=shared&categories=food,budget");
  assert.equal(original.has("categories"), false);
  assert.deepEqual(getComparisonCategories(updateSecondaryDestination(added, "barcelona")), ["food", "budget"]);
  assert.deepEqual(getComparisonCategories(updateSecondaryDestination(added, null)), ["food", "budget"]);
  const removed = updateComparisonCategories(added, ["budget"]);
  assert.deepEqual(getComparisonCategories(removed), ["budget"]);
  const empty = updateComparisonCategories(removed, []);
  assert.equal(empty.toString(), original.toString());
});

test("category choices combine both destinations, exclude overall, and sort by display name", () => {
  assert.deepEqual(getComparisonCategoryOptions(undefined), []);
  assert.deepEqual(getComparisonCategoryOptions([
    { slug: "food", name: "Food", score: 8 },
    { slug: "overall", name: "Overall Score", score: 9 },
  ], [
    { slug: "budget", name: "Budget", score: 7 },
    { slug: "food", name: "Other label", score: 6 },
  ]), [{ slug: "budget", name: "Budget" }, { slug: "food", name: "Food" }]);
});

test("comparison scores preserve zero and ten, and explicitly identify unavailable values", () => {
  const score = (value: number) => getComparisonScore([{ slug: "food", name: "Food", score: value }], "food");
  assert.equal(score(0), 0);
  assert.equal(score(10), 10);
  assert.equal(score(8.25), 8.25);
  for (const value of [NaN, Infinity, -1, 11]) assert.equal(score(value), null);
  assert.equal(getComparisonScore(undefined, "food"), null);
  assert.equal(getComparisonScore([], "food"), null);
});

test("selected category rows survive shared links, refresh parsing, and Back/Forward", async () => {
  const router = createMemoryRouter([{ path: "/compare" }], {
    initialEntries: ["/compare?destination=lisbon&with=porto"],
  });
  const current = () => new URLSearchParams(router.state.location.search);
  try {
    await router.navigate({ search: discoverySearch(updateComparisonCategories(current(), ["food", "budget"])) });
    const shared = new URL(router.state.location.pathname + router.state.location.search, "https://destinome.test");
    assert.deepEqual(getComparisonCategories(shared.searchParams), ["food", "budget"]);
    assert.equal(getSecondaryDestinationSlug(shared.searchParams), "porto");
    await router.navigate({ search: discoverySearch(updateComparisonCategories(current(), ["budget"])) });
    await router.navigate(-1);
    assert.deepEqual(getComparisonCategories(current()), ["food", "budget"]);
    await router.navigate(-1);
    assert.deepEqual(getComparisonCategories(current()), []);
    await router.navigate(1);
    assert.deepEqual(getComparisonCategories(current()), ["food", "budget"]);
    await router.navigate(1);
    assert.deepEqual(getComparisonCategories(current()), ["budget"]);
  } finally { router.dispose(); }
});
