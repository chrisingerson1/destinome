import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";

// Queries are intercepted before they reach PostgreSQL.
process.env.DATABASE_URL ??= "postgres://unused:unused@localhost/unused";
const { pool } = await import("@destinome/database");
const { destinationsListRoutes } = await import("../src/routes/destinations-list.js");

test("destination list ordering", async (t) => {
  const queries: { text: string; values: unknown[] }[] = [];
  t.mock.method(pool, "query", async (config: { text: string }, values: unknown[]) => {
    queries.push({ text: config.text, values });
    return { rows: config.text.includes("count(*)") ? [[0]] : [] };
  });
  const app = Fastify();
  await app.register(destinationsListRoutes);
  t.after(() => app.close());

  const ordering = () => {
    const query = queries.find(({ text }) => !text.includes("count(*)"));
    assert.ok(query);
    return query.text.split(" order by ")[1]?.split(" limit ")[0];
  };

  await t.test("overall sorting puts nulls last and breaks ties by name then ID", async () => {
    queries.length = 0;
    const response = await app.inject("/destinations?sort=overall&page=2&limit=10");
    assert.equal(response.statusCode, 200);
    assert.equal(ordering(), '"destination_tag_scores"."score" DESC NULLS LAST, "destinations"."name" COLLATE "und-x-icu" ASC, "destinations"."id" asc');
    assert.deepEqual(queries[0].values.slice(-2), [10, 10]);
    assert.deepEqual(response.json().pagination, { page: 2, limit: 10, total: 0, totalPages: 0 });
  });

  await t.test("omitting sort preserves alphabetical ordering", async () => {
    queries.length = 0;
    assert.equal((await app.inject("/destinations")).statusCode, 200);
    assert.equal(ordering(), '"destinations"."name" COLLATE "und-x-icu" ASC, "destinations"."id" asc');
  });

  await t.test("search without sort preserves relevance before score", async () => {
    queries.length = 0;
    assert.equal((await app.inject("/destinations?search=Paris")).statusCode, 200);
    assert.match(ordering()!, /^CASE/);
    assert.match(ordering()!, /END, "destination_tag_scores"\."score" DESC NULLS LAST/);
  });

  await t.test("explicit overall sorting takes precedence over search relevance", async () => {
    queries.length = 0;
    assert.equal((await app.inject("/destinations?search=Paris&sort=overall")).statusCode, 200);
    assert.match(ordering()!, /^"destination_tag_scores"\."score" DESC NULLS LAST/);
    assert.doesNotMatch(ordering()!, /CASE/);
    assert.match(queries[0].text, / where /);
  });

  await t.test("search folds accents in both filtering and relevance without altering response names", async () => {
    queries.length = 0;
    assert.equal((await app.inject(`/destinations?search=${encodeURIComponent("BELÉM")}`)).statusCode, 200);
    const list = queries.find(({ text }) => !text.includes("count(*)"));
    const total = queries.find(({ text }) => text.includes("count(*)"));
    assert.ok(list);
    assert.ok(total);
    for (const query of [list, total]) {
      assert.match(query.text.split(" where ")[1], /normalize\(/);
      assert.ok(query.values.includes("belem%"));
    }
    assert.match(ordering()!, /normalize\("destinations"\."name", NFD\)/);
    assert.ok(list.values.includes("belem"));
    assert.ok(!list.values.includes("BELÉM"));
    assert.match(list.text.split(" from ")[0], /"destinations"\."name"/);
  });

  await t.test("unsupported sorting returns 400 before querying", async () => {
    queries.length = 0;
    const response = await app.inject("/destinations?sort=invalid");
    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.json(), { error: "Sort must be overall when provided" });
    assert.equal(queries.length, 0);
  });
});

test("destination score-filter validation", async (t) => {
  const queries: { text: string; values: unknown[] }[] = [];
  let failTagLookup = false;
  t.mock.method(pool, "query", async (config: { text: string }, values: unknown[]) => {
    queries.push({ text: config.text, values });
    if (config.text.includes('from "tags"')) {
      if (failTagLookup) throw new Error("Database unavailable");
      return { rows: [["food"], ["nature"]] };
    }
    return { rows: config.text.includes("count(*)") ? [[0]] : [] };
  });
  const app = Fastify();
  await app.register(destinationsListRoutes);
  t.after(() => app.close());

  await t.test("malformed filters return 400 without querying", async () => {
    for (const scores of ["food:", "food:8:9", "food:11", "food:8,", "food:abc"]) {
      queries.length = 0;
      const response = await app.inject(`/destinations?${new URLSearchParams({ scores })}`);
      assert.equal(response.statusCode, 400, scores);
      assert.match(response.json().error, /^Invalid score filter:/);
      assert.equal(queries.length, 0);
    }
  });

  await t.test("repeated scores parameters return 400", async () => {
    queries.length = 0;
    const response = await app.inject("/destinations?scores=food:8&scores=nature:7");
    assert.equal(response.statusCode, 400);
    assert.equal(queries.length, 0);
  });

  await t.test("unknown categories return 400 after checking database tags", async () => {
    queries.length = 0;
    const response = await app.inject("/destinations?scores=food:8,unknown:7");
    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.json(), { error: "Unknown score categories: unknown" });
    assert.equal(queries.length, 1);
    assert.deepEqual(queries[0].values, ["food", "unknown"]);
  });

  await t.test("valid filters apply inclusive thresholds to both results and count", async () => {
    queries.length = 0;
    const response = await app.inject("/destinations?scores=Food:0,nature:10&sort=overall");
    assert.equal(response.statusCode, 200);
    assert.equal(queries.length, 3);
    assert.deepEqual(queries[0].values, ["food", "nature"]);
    for (const query of queries.slice(1)) {
      // Both categories must have an existing score at or above the minimum.
      assert.equal((query.text.match(/EXISTS/g) ?? []).length, 2);
      assert.equal((query.text.match(/"destination_tag_scores"\."score" >=/g) ?? []).length, 2);
      assert.match(query.text, /\)\s+and\s+EXISTS/);
      assert.ok(query.values.includes("food"));
      assert.ok(query.values.includes(0));
      assert.ok(query.values.includes("nature"));
      assert.ok(query.values.includes(10));
    }
  });

  await t.test("database failures remain server errors", async () => {
    failTagLookup = true;
    const response = await app.inject("/destinations?scores=food:8");
    assert.equal(response.statusCode, 500);
  });
});

test("destination list includes parent details and selected scores", async (t) => {
  const queries: { text: string; values: unknown[] }[] = [];
  // Field order matches the Drizzle selection; exercise its nested-object mapping.
  let listRows: unknown[][] = [
    [1, "city-1", "Paris", "paris", "France", "FR", "FRA", "Île-de-France", 9, null, null, null, null],
    [2, "area-2", "Montmartre", "montmartre", "France", "FR", "FRA", "Île-de-France", null, 1, 1, "Paris", "paris"],
  ];
  let selectedScores: unknown[][] = [
    [1, "food", 8.5], [1, "nature", 7], [2, "food", 0], [2, "nature", 6.5],
  ];
  t.mock.method(pool, "query", async (config: { text: string }, values: unknown[]) => {
    queries.push({ text: config.text, values });
    if (config.text.includes('from "tags"')) return { rows: [["food"], ["nature"]] };
    if (config.text.includes("count(*)")) return { rows: [[3]] };
    if (config.text.includes('from "destination_tag_scores"')) return { rows: selectedScores };
    return { rows: listRows };
  });
  const app = Fastify();
  await app.register(destinationsListRoutes);
  t.after(() => app.close());

  await t.test("top-level and neighborhood results retain existing fields and pagination", async () => {
    queries.length = 0;
    const response = await app.inject("/destinations?sort=overall&limit=2");
    assert.equal(response.statusCode, 200);
    const { data, pagination } = response.json();
    assert.deepEqual(data[0], {
      id: 1, sourceId: "city-1", name: "Paris", slug: "paris",
      country: { name: "France", iso2: "FR", iso3: "FRA" },
      adminArea: "Île-de-France", overallScore: 9,
      parentDestinationId: null, parentDestination: null, scores: {},
    });
    assert.equal(data[1].parentDestinationId, 1);
    assert.deepEqual(data[1].parentDestination, { id: 1, name: "Paris", slug: "paris" });
    assert.equal(data[1].overallScore, null);
    assert.deepEqual(data[1].scores, {});
    assert.deepEqual(pagination, { page: 1, limit: 2, total: 3, totalPages: 2 });
    assert.equal(queries.length, 2);
    assert.match(queries[0].text, /left join "destinations" "parent_destination" on "destinations"\."parent_destination_id" = "parent_destination"\."id"/);
    assert.doesNotMatch(queries[1].text, /"parent_destination"/);
  });

  await t.test("selected scores are batched for only the current page and requested categories", async () => {
    queries.length = 0;
    const response = await app.inject("/destinations?scores=food:0,nature:0&limit=2");
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json().data.map((row: { scores: unknown }) => row.scores), [
      { food: 8.5, nature: 7 }, { food: 0, nature: 6.5 },
    ]);
    assert.equal(queries.length, 4);
    assert.deepEqual(queries[3].values, [1, 2, "food", "nature"]);
    assert.match(queries[3].text, /"destination_tag_scores"\."destination_id" in/);
    assert.match(queries[3].text, /"tags"\."slug" in/);
  });

  await t.test("unavailable selected scores remain null rather than zero", async () => {
    selectedScores = [[1, "food", 8.5]];
    const response = await app.inject("/destinations?scores=food:0,nature:0");
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json().data[0].scores, { food: 8.5, nature: null });
  });

  await t.test("empty pages skip score enrichment while retaining pagination", async () => {
    queries.length = 0;
    listRows = [];
    const response = await app.inject("/destinations?scores=food:0&page=3&limit=2");
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), {
      data: [], pagination: { page: 3, limit: 2, total: 3, totalPages: 2 },
    });
    assert.equal(queries.length, 3);
  });
});
