import assert from "node:assert/strict";
import { test } from "node:test";
import { createMemoryRouter } from "react-router";
import { comparisonHref, getSecondaryDestinationSlug, updateSecondaryDestination } from "../src/lib/comparison.ts";
import { destinationHref, discoveryReturnTo, discoverySearch } from "../src/lib/discovery.ts";

test("comparison links preload the destination and work without saved map settings", () => {
  assert.equal(comparisonHref("north-end-boston"), "/compare?destination=north-end-boston");
  const params = new URL(comparisonHref("north-end-boston"), "https://destinome.test").searchParams;
  assert.equal(params.get("destination"), "north-end-boston");
  assert.equal(discoveryReturnTo(params), "/map");
});

test("details to comparison to details retains the original discovery URL", () => {
  const mapUrl = "/map?scores=food:8,budget:7&category=food&page=2&view=2,47,4,0,0";
  const detailsUrl = new URL(destinationHref("lisbon", mapUrl), "https://destinome.test");
  const compareUrl = new URL(comparisonHref("lisbon", discoveryReturnTo(detailsUrl.searchParams)), detailsUrl);
  assert.equal(compareUrl.pathname, "/compare");
  assert.equal(compareUrl.searchParams.get("destination"), "lisbon");
  const restoredMap = discoveryReturnTo(compareUrl.searchParams);
  assert.equal(restoredMap, mapUrl);
  const backToDetails = new URL(destinationHref(compareUrl.searchParams.get("destination")!, restoredMap), compareUrl);
  assert.equal(backToDetails.href, detailsUrl.href);
});

test("return URLs show readable paths, score separators, and coordinates on both pages", () => {
  const mapUrl = "/map?scores=overall:9.5,budget:8&category=budget&view=2.75971,47.01698,4.34,0,0";
  for (const href of [destinationHref("lisbon", mapUrl), comparisonHref("lisbon", mapUrl)]) {
    assert.ok(href.includes("returnTo=/map?scores=overall:9.5,budget:8%26category=budget%26view=2.75971,47.01698,4.34,0,0"));
    const url = new URL(href, "https://destinome.test");
    assert.equal(discoveryReturnTo(url.searchParams), mapUrl);
    assert.equal(url.searchParams.has("category"), false);
    assert.equal(url.searchParams.has("view"), false);
  }
});

test("readable return URLs preserve inner escaped values, fragments, and query boundaries", () => {
  const mapUrl = "/map?campaign=a%26b%3Dc%23d%2Fe%2Cf%3Ag%3Fh%25i+literal&view=2,47,4,0,0#camera";
  for (const href of [destinationHref("lisbon", mapUrl), comparisonHref("lisbon", mapUrl)]) {
    const url = new URL(href, "https://destinome.test");
    assert.equal(url.hash, "");
    assert.equal(discoveryReturnTo(url.searchParams), mapUrl);
    assert.equal(url.searchParams.has("campaign"), false);
    assert.equal(url.searchParams.has("view"), false);
    assert.ok(href.includes("%252F"));
    assert.ok(href.includes("%23camera"));
  }
});

test("adding, replacing, and removing a comparison keeps the original destination and return URL", () => {
  const mapUrl = "/map?scores=food:8&view=2,47,4,0,0";
  const original = new URL(comparisonHref("lisbon", mapUrl), "https://destinome.test").searchParams;
  original.set("campaign", "shared");
  const added = updateSecondaryDestination(original, "barcelona");
  assert.equal(getSecondaryDestinationSlug(added), "barcelona");
  assert.equal(added.get("destination"), "lisbon");
  assert.equal(discoveryReturnTo(added), mapUrl);
  assert.equal(added.get("campaign"), "shared");
  assert.equal(original.has("with"), false);
  const replaced = updateSecondaryDestination(added, "porto");
  assert.equal(getSecondaryDestinationSlug(replaced), "porto");
  const removed = updateSecondaryDestination(replaced, null);
  assert.equal(getSecondaryDestinationSlug(removed), undefined);
  assert.equal(removed.get("destination"), "lisbon");
  assert.equal(discoveryReturnTo(removed), mapUrl);
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
    initialEntries: [comparisonHref("lisbon", "/map?view=2,47,4,0,0")],
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
