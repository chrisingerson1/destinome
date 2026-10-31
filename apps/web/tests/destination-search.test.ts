import assert from "node:assert/strict";
import { test } from "node:test";
import { searchDestinations, searchDestinationsPage } from "../src/lib/destinations.ts";

test("paginated destination search retrieves all administrative-area matches beyond eight suggestions", async (t) => {
  const controller = new AbortController();
  const pages: number[] = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "https://destinome.test");
    assert.equal(url.searchParams.get("search"), "Massachusetts");
    assert.equal(url.searchParams.get("limit"), "8");
    assert.equal(init?.signal, controller.signal);
    const page = Number(url.searchParams.get("page"));
    pages.push(page);
    const start = (page - 1) * 8;
    return Response.json({
      data: Array.from({ length: Math.min(8, 18 - start) }, (_, index) => ({
        id: start + index + 1, name: `Town ${start + index + 1}`, slug: `town-${start + index + 1}`,
        adminArea: "Massachusetts", country: { name: "United States of America" },
      })),
      pagination: { page, limit: 8, total: 18, totalPages: 3 },
    });
  });
  const ids: number[] = [];
  let page = 1;
  for (;;) {
    const result = await searchDestinationsPage("Massachusetts", page, controller.signal);
    ids.push(...result.data.map(({ id }) => id));
    if (page === result.pagination.totalPages) break;
    page++;
  }
  assert.deepEqual(pages, [1, 2, 3]);
  assert.deepEqual(ids, Array.from({ length: 18 }, (_, index) => index + 1));
});

test("existing parent-name searches retain their first-page array interface", async (t) => {
  const data = [{ id: 1, name: "Charlestown", slug: "charlestown-boston" }];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "https://destinome.test");
    assert.equal(url.searchParams.get("search"), "Charlestown");
    assert.equal(url.searchParams.get("page"), "1");
    return Response.json({ data, pagination: { page: 1, totalPages: 1, total: 1, limit: 8 } });
  });
  assert.deepEqual(await searchDestinations("Charlestown"), data);
});

test("a failed next-page request can be retried without advancing past the failed page", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "https://destinome.test");
    assert.equal(url.searchParams.get("page"), "2");
    if (++calls === 1) return new Response(null, { status: 503 });
    return Response.json({ data: [], pagination: { page: 2, totalPages: 2, total: 8, limit: 8 } });
  });
  await assert.rejects(searchDestinationsPage("Massachusetts", 2), /Unable to search destinations/);
  assert.equal((await searchDestinationsPage("Massachusetts", 2)).pagination.page, 2);
  assert.equal(calls, 2);
});
