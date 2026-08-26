"use client";

import { useMemo, useState } from "react";
import { saveClinicalFindings } from "./clinical-finding-actions";

type ClinicalTest = {
  id: string;
  category: string;
  body_region: string;
  test_name: string;
  measurement_type: string;
  allows_right_left: boolean;

  input_type: string;
  unit: string | null;

  right_label: string | null;
  left_label: string | null;
};

type Props = {
  clientId: string;
  tests: ClinicalTest[];
};

const MMT_VALUES = [
  "",
  "0/5",
  "1/5",
  "2-/5",
  "2/5",
  "2+/5",
  "3-/5",
  "3/5",
  "3+/5",
  "4-/5",
  "4/5",
  "4+/5",
  "5/5",
];

const POS_NEG_VALUES = [
  "",
  "Negative",
  "Positive",
];

export default function ClinicalFindingsClient({
  clientId,
  tests,
}: Props) {
  const today = new Date()
    .toISOString()
    .slice(0, 10);

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState("Strength");

  const [bodyRegion, setBodyRegion] =
    useState("All");

  const [selectedTests, setSelectedTests] =
    useState<string[]>([]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        tests.map((test) => test.category)
      )
    );
  }, [tests]);

  const bodyRegions = useMemo(() => {
    return Array.from(
      new Set(
        tests
          .filter(
            (test) =>
              test.category === category
          )
          .map(
            (test) => test.body_region
          )
      )
    );
  }, [tests, category]);

  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      const matchesCategory =
        test.category === category;

      const matchesRegion =
        bodyRegion === "All" ||
        test.body_region === bodyRegion;

      const searchText =
        search.trim().toLowerCase();

      const matchesSearch =
        searchText === "" ||
        test.test_name
          .toLowerCase()
          .includes(searchText) ||
        test.body_region
          .toLowerCase()
          .includes(searchText) ||
        test.category
          .toLowerCase()
          .includes(searchText);

      return (
        matchesCategory &&
        matchesRegion &&
        matchesSearch
      );
    });
  }, [
    tests,
    category,
    bodyRegion,
    search,
  ]);

  const selectedTestObjects =
    tests.filter((test) =>
      selectedTests.includes(test.id)
    );

  function toggleTest(testId: string) {
    setSelectedTests((current) =>
      current.includes(testId)
        ? current.filter(
            (id) => id !== testId
          )
        : [...current, testId]
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Clinical Findings
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Select only the assessments or findings you performed.
        </p>
      </div>

      {/* SEARCH */}

      <div className="mt-6">

        <label className="mb-1 block text-sm font-semibold text-slate-700">
          Search
        </label>

        <input
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Search hip flexion, TUG, single leg stance..."
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400"
        />

      </div>

      {/* CATEGORY */}

      <div className="mt-6">

        <p className="mb-2 text-sm font-semibold text-slate-700">
          Category
        </p>

        <div className="flex flex-wrap gap-2">

          {categories.map(
            (item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setCategory(item);
                  setBodyRegion("All");
                }}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                  category === item
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                {item}
              </button>
            )
          )}

        </div>

      </div>

      {/* BODY REGION */}

      <div className="mt-5">

        <p className="mb-2 text-sm font-semibold text-slate-700">
          Body Region
        </p>

        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            onClick={() =>
              setBodyRegion("All")
            }
            className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
              bodyRegion === "All"
                ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                : "border-slate-300 bg-white text-slate-700"
            }`}
          >
            All
          </button>

          {bodyRegions.map(
            (region) => (
              <button
                key={region}
                type="button"
                onClick={() =>
                  setBodyRegion(region)
                }
                className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                  bodyRegion === region
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                {region}
              </button>
            )
          )}

        </div>

      </div>

      {/* TEST LIST */}

      <div className="mt-6">

        <p className="mb-3 text-sm font-semibold text-slate-700">
          Choose Findings
        </p>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">

          {filteredTests.map(
            (test) => {

              const checked =
                selectedTests.includes(
                  test.id
                );

              return (
                <label
                  key={test.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${
                    checked
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 bg-white"
                  }`}
                >

                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      toggleTest(test.id)
                    }
                    className="mt-1 h-4 w-4"
                  />

                  <div>

                    <p className="font-semibold text-slate-900">
                      {test.test_name}
                    </p>

                    <p className="text-xs text-slate-500">
                      {test.body_region}
                      {" · "}
                      {test.measurement_type}
                    </p>

                  </div>

                </label>
              );
            }
          )}

        </div>

      </div>

      {/* RESULTS */}

      {selectedTestObjects.length > 0 && (

        <form
          action={saveClinicalFindings}
          className="mt-8 border-t border-slate-200 pt-6"
        >

          <input
            type="hidden"
            name="client_id"
            value={clientId}
          />

          <div className="mb-6 max-w-xs">

            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Assessment Date
            </label>

            <input
              type="date"
              name="finding_date"
              required
              defaultValue={today}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 [color-scheme:light]"
            />

          </div>

          <h3 className="text-xl font-semibold text-slate-900">
            Enter Results
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Leave any field blank if it was not tested.
          </p>

          <div className="mt-5 space-y-4">

            {selectedTestObjects.map(
              (test) => (
                <div
                  key={test.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >

                  <input
                    type="hidden"
                    name="selected_test"
                    value={test.id}
                  />

                  <div className="mb-4">

                    <h4 className="font-bold text-slate-900">
                      {test.test_name}
                    </h4>

                    <p className="text-sm text-slate-500">
                      {test.category}
                      {" · "}
                      {test.body_region}
                      {" · "}
                      {test.measurement_type}
                    </p>

                  </div>

                  <AssessmentInput
                    test={test}
                  />

                  <div className="mt-4">

                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Notes
                      <span className="ml-1 font-normal text-slate-400">
                        optional
                      </span>
                    </label>

                    <input
                      name={`notes_${test.id}`}
                      placeholder="Symptoms, compensation, assistive device..."
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400"
                    />

                  </div>

                </div>
              )
            )}

          </div>

          <button
            type="submit"
            className="mt-6 rounded-xl bg-emerald-700 px-6 py-3 font-semibold text-white hover:bg-emerald-800"
          >
            Save Findings
          </button>

        </form>
      )}

    </section>
  );
}

function AssessmentInput({
  test,
}: {
  test: ClinicalTest;
}) {
  if (
    test.input_type === "bilateral_mmt"
  ) {
    return (
      <div className="grid gap-4 md:grid-cols-2">

        <SelectInput
          label={
            test.right_label || "RIGHT"
          }
          name={`right_${test.id}`}
          values={MMT_VALUES}
        />

        <SelectInput
          label={
            test.left_label || "LEFT"
          }
          name={`left_${test.id}`}
          values={MMT_VALUES}
        />

      </div>
    );
  }

  if (
    test.input_type ===
    "bilateral_select"
  ) {
    return (
      <div className="grid gap-4 md:grid-cols-2">

        <SelectInput
          label={
            test.right_label || "RIGHT"
          }
          name={`right_${test.id}`}
          values={POS_NEG_VALUES}
        />

        <SelectInput
          label={
            test.left_label || "LEFT"
          }
          name={`left_${test.id}`}
          values={POS_NEG_VALUES}
        />

      </div>
    );
  }

  if (
    test.input_type ===
    "bilateral_number"
  ) {
    return (
      <div className="grid gap-4 md:grid-cols-2">

        <NumberInput
          label={
            test.right_label || "RIGHT"
          }
          name={`right_${test.id}`}
          unit={test.unit}
        />

        <NumberInput
          label={
            test.left_label || "LEFT"
          }
          name={`left_${test.id}`}
          unit={test.unit}
        />

      </div>
    );
  }

  if (
    test.input_type ===
    "single_number"
  ) {
    return (
      <NumberInput
        label="RESULT"
        name={`single_${test.id}`}
        unit={test.unit}
      />
    );
  }

  if (
    test.input_type === "berg"
  ) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

        <p className="font-semibold text-amber-900">
          Berg Balance Scale
        </p>

        <p className="mt-1 text-sm text-amber-800">
          The full 14-item Berg form is coming next.
          For now, don&apos;t save Berg from this screen.
        </p>

      </div>
    );
  }

  return (
    <div>

      <label className="mb-1 block text-xs font-bold tracking-wide text-slate-500">
        RESULT
      </label>

      <input
        name={`single_${test.id}`}
        placeholder="Enter result"
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400"
      />

    </div>
  );
}

function SelectInput({
  label,
  name,
  values,
}: {
  label: string;
  name: string;
  values: string[];
}) {
  return (
    <div>

      <label className="mb-1 block text-xs font-bold tracking-wide text-slate-500">
        {label}
      </label>

      <select
        name={name}
        defaultValue=""
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
      >

        {values.map(
          (value) => (
            <option
              key={value}
              value={value}
            >
              {value || "Not tested"}
            </option>
          )
        )}

      </select>

    </div>
  );
}

function NumberInput({
  label,
  name,
  unit,
}: {
  label: string;
  name: string;
  unit: string | null;
}) {
  return (
    <div>

      <label className="mb-1 block text-xs font-bold tracking-wide text-slate-500">
        {label}
      </label>

      <div className="flex items-center gap-2">

        <input
          type="number"
          step="any"
          name={name}
          placeholder="Value"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400"
        />

        {unit && (
          <span className="min-w-fit font-semibold text-slate-500">
            {unit}
          </span>
        )}

      </div>

    </div>
  );
}