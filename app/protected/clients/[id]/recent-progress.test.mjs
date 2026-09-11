import test from "node:test";
import assert from "node:assert/strict";
import { recentProgress, displayFindingValue } from "./recent-progress.ts";

const testInfo = { test_name: "Flexion", unit: "°", allows_right_left: true, right_label: "Right", left_label: "Left" };
function finding(overrides = {}) {
  return { id: "latest", test_id: "flexion", finding_date: "2026-09-10", created_at: "2026-09-10T12:00:00Z", visit_id: "v2", visit_session_id: null, right_value: "151", left_value: "110", clinical_test_library: testInfo, ...overrides };
}
const previous = () => finding({ id: "previous", visit_id: "v1", finding_date: "2026-09-01", created_at: "2026-09-01T12:00:00Z", right_value: "122", left_value: "115" });
const visits = new Set(["v1", "v2"]);

test("compares both sides across distinct saved visits without changing source text", () => {
  const data = [previous(), finding()];
  const original = JSON.stringify(data);
  const result = recentProgress(data, visits);
  assert.equal(result[0].values[0].delta, "+29");
  assert.equal(result[0].values[1].delta, "-5");
  assert.equal(result[0].values[0].before, "122");
  assert.equal(JSON.stringify(data), original);
});

test("excludes drafts, session-linked rows, standalone findings and foreign visits", () => {
  const rows = [previous(), finding(), ...[
    { visit_id: null, visit_session_id: "draft" },
    { visit_id: "v2", visit_session_id: "other-session" },
    { visit_id: null, visit_session_id: null },
    { visit_id: "foreign", visit_session_id: null },
  ].map((links, i) => finding({ ...links, id: String(i), finding_date: "2026-09-11", right_value: "999" }))];
  assert.equal(recentProgress(rows, visits)[0].values[0].delta, "+29");
});

test("does not treat duplicates within one visit as repeated measures", () => {
  assert.deepEqual(recentProgress([finding(), finding({ id: "duplicate", right_value: "100" })], visits), []);
  const results = recentProgress([finding(), finding({ id: "older-duplicate", created_at: "2026-09-10T11:00:00Z", right_value: "100" }), previous()], visits);
  assert.equal(results[0].values[0].delta, "+29");
});

test("handles decimal values, zero and matching numeric scales", () => {
  const single = { ...testInfo, allows_right_left: false, unit: "s" };
  const compare = (before, after, unit = "s") => recentProgress([
    { ...previous(), right_value: before, clinical_test_library: { ...single, unit } }, finding({ right_value: after, clinical_test_library: { ...single, unit } }),
  ], visits)[0]?.values[0];
  assert.equal(compare("15.8", "12.6").delta, "-3.2");
  assert.equal(compare("0", "0").delta, "0");
  assert.equal(compare("6/10", "3/10", "/10").delta, "-3");
  assert.equal(compare("6/10", "3/5", "/10"), undefined);
  assert.equal(compare("15 s", "12.6", "s").delta, "-2.4");
});

test("does not invent numeric values from qualitative results, grades or ranges", () => {
  for (const value of ["Positive", "3+/5", "10-20", "12 painful", "", "NaN"]) {
    assert.deepEqual(recentProgress([previous(), finding({ right_value: value, left_value: null })], visits), []);
  }
});

test("limits overview to four tests ordered by recent measurement", () => {
  const rows = Array.from({ length: 6 }, (_, i) => [previous(), finding({ finding_date: `2026-09-${10 + i}` })].map(f => ({ ...f, test_id: `test-${i}` }))).flat();
  const result = recentProgress(rows, visits);
  assert.equal(result.length, 4);
  assert.equal(result[0].testId, "test-5");
});

test("formats raw values without duplicating units or rewriting text", () => {
  assert.equal(displayFindingValue("151", "°"), "151 °");
  assert.equal(displayFindingValue("151°", "°"), "151°");
  assert.equal(displayFindingValue("3/10", "/10"), "3/10");
  assert.equal(displayFindingValue("0", "s"), "0 s");
  assert.equal(displayFindingValue("limited by pain", "°"), "limited by pain");
});
