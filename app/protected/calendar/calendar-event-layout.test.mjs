import assert from "node:assert/strict";
import test from "node:test";
import { layoutCalendarEvents } from "./calendar-event-layout.ts";

test("empty days and adjacent events use no extra columns", () => {
  assert.equal(layoutCalendarEvents([]).size, 0);
  const result = layoutCalendarEvents([
    { id: "a", top: 0, height: 72 },
    { id: "b", top: 72, height: 72 },
  ]);
  assert.deepEqual(result.get("a"), { column: 0, columns: 1 });
  assert.deepEqual(result.get("b"), { column: 0, columns: 1 });
});

test("nested events share a group and reuse available columns", () => {
  const result = layoutCalendarEvents([
    { id: "long", top: 0, height: 216 },
    { id: "first", top: 0, height: 72 },
    { id: "second", top: 72, height: 72 },
    { id: "third", top: 100, height: 72 },
    { id: "later", top: 216, height: 72 },
  ]);
  assert.deepEqual(result.get("long"), { column: 0, columns: 3 });
  assert.deepEqual(result.get("first"), { column: 1, columns: 3 });
  assert.deepEqual(result.get("second"), { column: 1, columns: 3 });
  assert.deepEqual(result.get("third"), { column: 2, columns: 3 });
  assert.deepEqual(result.get("later"), { column: 0, columns: 1 });
});

test("short rendered blocks do not cover one another", () => {
  const result = layoutCalendarEvents([
    { id: "a", top: 0, height: 38 },
    { id: "b", top: 18, height: 38 },
  ]);
  assert.equal(result.get("a").columns, 2);
  assert.notEqual(result.get("a").column, result.get("b").column);
});

test("layout is deterministic and every overlapping pair has separate columns", () => {
  const events = Array.from({ length: 50 }, (_, i) => ({
    id: String(i), top: (i * 37) % 600, height: 38 + (i * 19) % 180,
  }));
  const result = layoutCalendarEvents(events);
  assert.deepEqual(result, layoutCalendarEvents([...events].reverse()));
  for (const a of events) for (const b of events) {
    if (a.id !== b.id && a.top < b.top + b.height && b.top < a.top + a.height) {
      assert.equal(result.get(a.id).columns, result.get(b.id).columns);
      assert.notEqual(result.get(a.id).column, result.get(b.id).column);
    }
  }
});
