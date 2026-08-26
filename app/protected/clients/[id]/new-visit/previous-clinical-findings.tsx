"use client";

import { useState } from "react";
import { saveVisitAssessments } from "./assessment-draft-actions";

type Test = {
  id: string;
  category: string;
  body_region: string;
  test_name: string;
  measurement_type: string;
  allows_right_left: boolean;
};

type Finding = {
  id: string;
  test_id: string;
  finding_date: string;
  right_value: string | null;
  left_value: string | null;
  notes: string | null;

  clinical_test_library: Test | null;

  visits?: {
    visit_number: number;
  } | null;
};

type Props = {
   visitSessionId: string; 
  findings: Finding[];
  formId: string;
  clientId: string;
  visitNumber: number;
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

export default function PreviousClinicalFindings({
  findings,
  formId,
  clientId,
  visitNumber,
  visitSessionId,
}: Props) {
  const [savingTestId, setSavingTestId] = useState<string | null>(null);

const [savedTestIds, setSavedTestIds] = useState<string[]>([]);

const [saveError, setSaveError] = useState("");
  
    const [retesting, setRetesting] =
    useState<string[]>([]);

  const categories = Array.from(
    new Set(
      findings
        .map(
          (finding) =>
            finding.clinical_test_library?.category
        )
        .filter(Boolean)
    )
  );

  function startRetest(testId: string) {
    setRetesting((current) =>
      current.includes(testId)
        ? current
        : [...current, testId]
    );
  }

  function removeRetest(testId: string) {
    setRetesting((current) =>
      current.filter(
        (id) => id !== testId
      )
    );
  }

  async function handleSaveAssessment(testId: string) {
  setSaveError("");
  setSavingTestId(testId);

  const visitForm = document.getElementById(
    formId
  ) as HTMLFormElement | null;

  if (!visitForm) {
    setSaveError("Could not find the visit form.");
    setSavingTestId(null);
    return;
  }

  const fullFormData = new FormData(visitForm);

  const formData = new FormData();

  formData.set("client_id", clientId);
  formData.set("visit_number", String(visitNumber));
  formData.set("visit_session_id", visitSessionId);

  const visitDate =
    String(fullFormData.get("visit_date") || "") ||
    new Date().toISOString().slice(0, 10);

  formData.set("visit_date", visitDate);

  formData.append(
    "retest_test_id",
    testId
  );

  const rightValue =
    fullFormData.get(`right_${testId}`);

  const leftValue =
    fullFormData.get(`left_${testId}`);

  const singleValue =
    fullFormData.get(`single_${testId}`);

  const notes =
    fullFormData.get(`notes_${testId}`);

  if (rightValue !== null) {
    formData.set(
      `right_${testId}`,
      String(rightValue)
    );
  }

  if (leftValue !== null) {
    formData.set(
      `left_${testId}`,
      String(leftValue)
    );
  }

  if (singleValue !== null) {
    formData.set(
      `single_${testId}`,
      String(singleValue)
    );
  }

  if (notes !== null) {
    formData.set(
      `notes_${testId}`,
      String(notes)
    );
  }

  try {
    await saveVisitAssessments(formData);

    setSavedTestIds((current) =>
      current.includes(testId)
        ? current
        : [...current, testId]
    );
  } catch (error) {
    setSaveError(
      error instanceof Error
        ? error.message
        : "Could not save assessment."
    );
  } finally {
    setSavingTestId(null);
  }
}

  return (
    <section className="rounded-2xl border border-sky-200 bg-sky-50 p-6 shadow-sm">

      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-wide text-sky-800">
          Previous Assessment
        </p>

        <h2 className="mt-2 text-xl font-semibold text-slate-900">
          Clinical Findings
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Latest known values. Reassess only what is relevant today.
        </p>
      </div>

      <div className="space-y-6">

        {categories.map((category) => (
          <div key={String(category)}>

            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
              {String(category)}
            </h3>

            <div className="space-y-3">

              {findings
                .filter(
                  (finding) =>
                    finding.clinical_test_library
                      ?.category === category
                )
                .map((finding) => {
                  const test =
                    finding.clinical_test_library;

                  if (!test) {
                    return null;
                  }

                  const isRetesting =
                    retesting.includes(test.id);

                  return (
                    <div
                      key={finding.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >

                      <div className="flex flex-wrap items-start justify-between gap-3">

                        <div>
                          <p className="font-semibold text-slate-900">
                            {test.test_name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {test.body_region}
                            {" · "}
                            {test.measurement_type}
                          </p>

                          <div className="mt-3 text-sm text-slate-700">

                            {test.allows_right_left ? (
                              <p>
                                <span className="font-semibold">
                                  Previous:
                                </span>{" "}
                                R:{" "}
                                {finding.right_value || "—"}
                                {" | "}
                                L:{" "}
                                {finding.left_value || "—"}
                              </p>
                            ) : (
                              <p>
                                <span className="font-semibold">
                                  Previous:
                                </span>{" "}
                                {finding.right_value || "—"}
                              </p>
                            )}

                          </div>

                          <p className="mt-1 text-xs text-slate-400">
                            Last tested:{" "}
                            {finding.visits?.visit_number
                              ? `Visit #${finding.visits.visit_number}`
                              : finding.finding_date}
                          </p>
                        </div>

                        {!isRetesting && (
                          <button
                            type="button"
                            onClick={() =>
                              startRetest(test.id)
                            }
                            className="rounded-lg border border-sky-300 bg-sky-100 px-3 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-200"
                          >
                            + Reassess
                          </button>
                        )}

                      </div>

                      {isRetesting && (
                        <div className="mt-4 border-t border-slate-200 pt-4">

                          {/* This tells saveVisit which test was reassessed */}
                          <input
                            type="hidden"
                            form={formId}
                            name="retest_test_id"
                            value={test.id}
                          />

                          <p className="mb-3 text-sm font-bold text-slate-900">
                            Today&apos;s Finding
                          </p>

                          {test.allows_right_left ? (
                            <div className="grid gap-3 sm:grid-cols-2">

                              <ResultInput
                                formId={formId}
                                name={`right_${test.id}`}
                                label="RIGHT"
                                measurementType={
                                  test.measurement_type
                                }
                              />

                              <ResultInput
                                formId={formId}
                                name={`left_${test.id}`}
                                label="LEFT"
                                measurementType={
                                  test.measurement_type
                                }
                              />

                            </div>
                          ) : (
                            <ResultInput
                              formId={formId}
                              name={`single_${test.id}`}
                              label="RESULT"
                              measurementType={
                                test.measurement_type
                              }
                            />
                          )}

                          <div className="mt-3">
                            <label className="mb-1 block text-xs font-bold text-slate-500">
                              NOTES
                              <span className="ml-1 font-normal">
                                optional
                              </span>
                            </label>

                            <input
                              form={formId}
                              name={`notes_${test.id}`}
                              placeholder="Pain, compensation, symptoms..."
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400"
                            />
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-3">

                            <div className="flex flex-wrap items-center gap-3">

  <button
    type="button"
    onClick={() =>
      handleSaveAssessment(test.id)
    }
    disabled={savingTestId === test.id}
    className="rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {savingTestId === test.id
      ? "Saving..."
      : savedTestIds.includes(test.id)
      ? "✓ Assessment Saved"
      : "Save Assessment"}
  </button>

  <button
    type="button"
    onClick={() =>
      removeRetest(test.id)
    }
    className="text-sm font-semibold text-red-600"
  >
    Remove
  </button>

</div>

    {saveError && (
  <p className="mt-3 text-sm font-semibold text-red-600">
    {saveError}
  </p>
)}                        

                          </div>

                        </div>
                      )}

                    </div>
                  );
                })}

            </div>

          </div>
        ))}

      </div>

    </section>
  );
}

function ResultInput({
  formId,
  name,
  label,
  measurementType,
}: {
  formId: string;
  name: string;
  label: string;
  measurementType: string;
}) {
  return (
    <div>

      <label className="mb-1 block text-xs font-bold tracking-wide text-slate-500">
        {label}
      </label>

      {measurementType === "MMT" ? (
        <select
          form={formId}
          name={name}
          defaultValue=""
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
        >
          {MMT_VALUES.map((value) => (
            <option
              key={value}
              value={value}
            >
              {value || "Not tested"}
            </option>
          ))}
        </select>
      ) : measurementType === "Positive/Negative" ? (
        <select
          form={formId}
          name={name}
          defaultValue=""
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
        >
          {POS_NEG_VALUES.map((value) => (
            <option
              key={value}
              value={value}
            >
              {value || "Not tested"}
            </option>
          ))}
        </select>
      ) : (
        <div className="flex items-center gap-2">

          <input
            form={formId}
            name={name}
            inputMode="decimal"
            placeholder="Value"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400"
          />

          {measurementType === "Degrees" && (
            <span className="font-semibold text-slate-500">
              °
            </span>
          )}

        </div>
      )}

    </div>
  );
}