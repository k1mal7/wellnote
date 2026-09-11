export type SnapshotTest = {
  test_name: string;
  unit: string | null;
  allows_right_left: boolean;
  right_label: string | null;
  left_label: string | null;
};

export type SnapshotFinding = {
  id: string;
  test_id: string;
  finding_date: string;
  created_at: string;
  visit_id: string | null;
  visit_session_id: string | null;
  right_value: string | null;
  left_value: string | null;
  clinical_test_library: SnapshotTest | null;
};

// Accept plain numeric measurements or explicit matching units/scales, not grades,
// ranges, qualitative results, or free text. Never infer clinical improvement.
function numericValue(raw: string | null, unit: string | null) {
  if (raw === null || !raw.trim()) return null;
  const match = raw.trim().match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*(.*)$/);
  if (!match) return null;
  const suffix = match[2].trim();
  const expected = (unit ?? "").trim();
  if (suffix && suffix !== expected && !/^\/\s*\d+(?:\.\d+)?$/.test(suffix)) return null;
  const scale = suffix.startsWith("/") ? suffix.replace(/\s/g, "") : expected;
  const value = Number(match[1]);
  return Number.isFinite(value) ? { value, scale } : null;
}

export function recentProgress(findings: SnapshotFinding[], visitIds: Set<string>, limit = 4) {
  const ordered = findings.filter(f => f.visit_id && !f.visit_session_id && visitIds.has(f.visit_id))
    .sort((a, b) => b.finding_date.localeCompare(a.finding_date) || b.created_at.localeCompare(a.created_at));
  const tests = new Map<string, SnapshotFinding[]>();
  for (const finding of ordered) {
    const history = tests.get(finding.test_id) ?? [];
    if (!history.some(item => item.visit_id === finding.visit_id)) history.push(finding);
    tests.set(finding.test_id, history);
  }
  const comparisons = [];
  for (const [testId, [latest, previous]] of tests) {
    const test = latest.clinical_test_library;
    if (!previous || !test) continue;
    const sides = test.allows_right_left ? ["right", "left"] as const : ["right"] as const;
    const values = sides.flatMap(side => {
      const beforeRaw = side === "right" ? previous.right_value : previous.left_value;
      const afterRaw = side === "right" ? latest.right_value : latest.left_value;
      const before = numericValue(beforeRaw, test.unit);
      const after = numericValue(afterRaw, test.unit);
      if (!before || !after || before.scale !== after.scale) return [];
      const delta = Number((after.value - before.value).toFixed(6));
      return [{ side, label: test.allows_right_left ? (side === "right" ? test.right_label || "Right" : test.left_label || "Left") : null,
        before: beforeRaw!, after: afterRaw!, delta: `${delta > 0 ? "+" : ""}${delta}`, unit: after.scale.startsWith("/") ? "" : test.unit || "" }];
    });
    if (values.length) comparisons.push({ testId, name: test.test_name, unit: test.unit, previousDate: previous.finding_date, latestDate: latest.finding_date, values });
  }
  return comparisons.slice(0, limit);
}

export function displayFindingValue(value: string | null, unit: string | null) {
  if (value === null || value === "") return "—";
  // Append library units only to a bare number; preserve stored text verbatim.
  return unit && /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(value.trim()) ? `${value} ${unit}` : value;
}
