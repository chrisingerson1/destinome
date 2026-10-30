import assert from "node:assert/strict";
import { test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { deferMapInitialization } from "../src/lib/deferMapInitialization.ts";

test("Strict Mode's cancelled setup creates no map and the surviving setup is disposed", async () => {
  let instances = 0;
  let disposals = 0;
  const initialize = () => {
    instances++;
    return () => { disposals++; };
  };
  const cancelProbe = deferMapInitialization(initialize);
  cancelProbe();
  const cleanup = deferMapInitialization(initialize);
  await delay(10);
  assert.equal(instances, 1);
  assert.equal(disposals, 0);
  cleanup();
  assert.equal(disposals, 1);
});

test("unmounting before initialization starts makes no provider requests", async () => {
  let initialized = false;
  deferMapInitialization(() => { initialized = true; })();
  await delay(10);
  assert.equal(initialized, false);
});
