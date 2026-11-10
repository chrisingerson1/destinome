import assert from "node:assert/strict";
import { test } from "node:test";
import { createMemoryRouter } from "react-router";
import { apiPath } from "../src/lib/appPaths.ts";
import { comparisonHref } from "../src/lib/comparison.ts";
import { destinationHref } from "../src/lib/discovery.ts";
import { createMapReturnStore } from "../src/lib/mapReturn.ts";

test("API URLs follow the app mount point rather than the current deep link", () => {
  for (const base of ["/", "/destinome/"]) {
    for (const endpoint of ["destination/lisbon", "destinations/map", "destinations/map/scores", "destinations?search=S%C3%A3o+Paulo&page=2"]) {
      const path = apiPath(endpoint, base);
      const url = new URL(path, `https://destinome.test${base}destination/lisbon`);
      assert.equal(url.pathname + url.search, `${base}api/${endpoint}`);
    }
  }
  assert.equal(apiPath("destinations"), "/api/destinations");
});

for (const base of ["/", "/destinome/"]) {
  test(`navigation, shared links, and saved map views work under ${base}`, async () => {
    const basename = base.replace(/\/$/, "") || "/";
    const routes = [
      { id: "home", path: "/" },
      { id: "map", path: "/map" },
      { id: "destination", path: "/destination/:slug" },
      { id: "compare", path: "/compare" },
    ];
    const mapUrl = "/map?scores=food:8&category=food&view=2,47,4,0,0#globe";
    const store = createMapReturnStore(() => undefined);
    store.save(mapUrl);
    const router = createMemoryRouter(routes, {
      basename,
      initialEntries: [`${base}${mapUrl.slice(1)}`],
    });
    try {
      assert.equal(router.state.matches.at(-1)?.route.id, "map");
      await router.navigate(destinationHref("lisbon"));
      assert.equal(router.state.location.pathname, `${base}destination/lisbon`);
      assert.equal(router.state.matches.at(-1)?.params.slug, "lisbon");
      await router.navigate(comparisonHref("lisbon"));
      assert.equal(router.state.location.pathname, `${base}compare`);
      assert.equal(router.state.location.search, "?destination=lisbon");

      const sharedUrl = router.state.location.pathname + router.state.location.search;
      const refreshed = createMemoryRouter(routes, { basename, initialEntries: [sharedUrl] });
      try {
        assert.equal(refreshed.state.matches.at(-1)?.route.id, "compare");
        assert.equal(refreshed.state.location.search, "?destination=lisbon");
      } finally { refreshed.dispose(); }

      await router.navigate(store.getSnapshot());
      assert.equal(router.state.location.pathname + router.state.location.search + router.state.location.hash, `${base}${mapUrl.slice(1)}`);
      await router.navigate(-1);
      assert.equal(router.state.location.pathname, `${base}compare`);
      await router.navigate("/");
      assert.equal(router.state.matches.at(-1)?.route.id, "home");
    } finally { router.dispose(); }

    if (base !== "/") {
      const bareMount = createMemoryRouter(routes, { basename, initialEntries: [basename] });
      try {
        assert.equal(bareMount.state.matches.at(-1)?.route.id, "home");
      } finally { bareMount.dispose(); }
    }
  });
}
