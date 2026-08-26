"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  saveVisitAssessments,
  updateVisitAssessment,
} from "./assessment-draft-actions";

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

type SavedFinding = {
  id: string;
  test_id: string;
  finding_date: string;
  right_value: string | null;
  left_value: string | null;
  notes: string | null;
  details: any;
  clinical_test_library: ClinicalTest | null;
};

type Props = {
  visitSessionId: string;
  tests: ClinicalTest[];
  formId: string;
  clientId: string;
  visitNumber: number;
  savedFindings: SavedFinding[];
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

export default function VisitAssessmentPicker({
  tests,
  formId,
  clientId,
  visitNumber,
  visitSessionId,
  savedFindings,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [bodyRegion, setBodyRegion] = useState<string | null>(null);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [editingFindingId, setEditingFindingId] =
  useState<string | null>(null);

const [isUpdating, setIsUpdating] =
  useState(false);

const [updateMessage, setUpdateMessage] =
  useState("");

const uniqueSavedFindings = savedFindings.filter(
  (finding, index, array) =>
    index ===
    array.findIndex(
      (item) => item.test_id === finding.test_id
    )
);

const savedTestIds = new Set(
  uniqueSavedFindings.map(
    (finding) => finding.test_id
  )
);

  const categories = useMemo(() => {
    return Array.from(
      new Set(tests.map((test) => test.category))
    );
  }, [tests]);

  const bodyRegions = useMemo(() => {
    if (!category) return [];

    return Array.from(
      new Set(
        tests
          .filter((test) => test.category === category)
          .map((test) => test.body_region)
      )
    );
  }, [tests, category]);

  const visibleTests = useMemo(() => {
  if (!category || !bodyRegion) return [];

  return tests.filter(
    (test) =>
      test.category === category &&
      test.body_region === bodyRegion &&
      !savedTestIds.has(test.id)
  );
}, [
  tests,
  category,
  bodyRegion,
  savedFindings,
]);

  const selectedTestObjects = tests.filter((test) =>
    selectedTests.includes(test.id)
  );

function toggleTest(testId: string) {
  setSelectedTests((current) =>
    current.includes(testId)
      ? current.filter((id) => id !== testId)
      : [...current, testId]
  );
}

async function handleSaveAssessments() {
  setSaveMessage("");

  if (selectedTests.length === 0) {
    setSaveMessage("Select at least one assessment.");
    return;
  }
async function handleUpdateAssessment(
  finding: SavedFinding
) {
  const test =
    finding.clinical_test_library;

  if (!test) return;

  const editForm = document.getElementById(
    `edit-assessment-${finding.id}`
  ) as HTMLFormElement | null;

  if (!editForm) return;

  const formData = new FormData(editForm);

  formData.set("finding_id", finding.id);
  formData.set("test_id", finding.test_id);

  setIsUpdating(true);
  setUpdateMessage("");

  try {
    await updateVisitAssessment(formData);

    setUpdateMessage("✓ Assessment updated");
    setEditingFindingId(null);

    router.refresh();
  } catch (error) {
    setUpdateMessage(
      error instanceof Error
        ? error.message
        : "Could not update assessment."
    );
  } finally {
    setIsUpdating(false);
  }
}
  const visitForm = document.getElementById(
    formId
  ) as HTMLFormElement | null;

  if (!visitForm) {
    setSaveMessage("Could not find the visit form.");
    return;
  }

  const formData = new FormData(visitForm);
  formData.set("visit_session_id", visitSessionId);

  setIsSaving(true);

  try {
    const result = await saveVisitAssessments(formData);

    setSaveMessage(
      `✓ ${result.count} ${
        result.count === 1
          ? "assessment"
          : "assessments"
      } saved`
    );

   setSelectedTests([]);
setOpen(false);
setCategory(null);
setBodyRegion(null);

router.refresh();

  } catch (error) {
    setSaveMessage(
      error instanceof Error
        ? error.message
        : "Could not save assessments."
    );
  } finally {
    setIsSaving(false);
  }
}

  return (
    <section className="rounded-2xl border border-sky-200 bg-sky-50 p-5">

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Assessments Today
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Add only the tests you performed during this visit.
          </p>
        </div>

        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-xl border border-sky-300 bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-200"
          >
            + Add Assessment
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setCategory(null);
              setBodyRegion(null);
            }}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Close Picker
          </button>
        )}
      </div>
{uniqueSavedFindings.length > 0 && (
  <div className="mt-5 space-y-3">
    <p className="text-sm font-semibold text-slate-700">
      Saved for this visit
    </p>

{uniqueSavedFindings.map((finding) => {
  const test =
    finding.clinical_test_library;

  if (!test) return null;

  const isEditing =
    editingFindingId === finding.id;

  return (
    <div
      key={finding.id}
      className="rounded-xl border border-emerald-200 bg-white p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">

        <div>
          <p className="font-semibold text-slate-900">
            {test.test_name}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {test.category}
            {" · "}
            {test.body_region}
          </p>
        </div>

        <div className="flex items-center gap-2">

          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            ✓ Saved
          </span>

          {!isEditing && (
            <button
              type="button"
              onClick={() => {
                setEditingFindingId(finding.id);
                setUpdateMessage("");
              }}
              className="text-sm font-semibold text-sky-700 hover:text-sky-800"
            >
              Edit
            </button>
          )}

        </div>
      </div>

      {isEditing ? (
        <form
          id={`edit-assessment-${finding.id}`}
          className="mt-4 space-y-4"
        >

          <AssessmentEditInput
            test={test}
            finding={finding}
          />

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Notes
            </label>

            <input
              name={`notes_${test.id}`}
              defaultValue={finding.notes || ""}
              placeholder="Optional"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
            />
          </div>

          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              disabled={isUpdating}
              onClick={() =>
                handleUpdateAssessment(finding)
              }
              className="rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-60"
            >
              {isUpdating
                ? "Saving..."
                : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={() =>
                setEditingFindingId(null)
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>

          </div>

        </form>
      ) : (
        <div className="mt-3">

          {test.allows_right_left ? (
            <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-800">

              <span>
                {test.right_label || "Right"}:{" "}
                {finding.right_value || "—"}
                {finding.right_value && test.unit
                  ? ` ${test.unit}`
                  : ""}
              </span>

              <span>
                {test.left_label || "Left"}:{" "}
                {finding.left_value || "—"}
                {finding.left_value && test.unit
                  ? ` ${test.unit}`
                  : ""}
              </span>

            </div>
          ) : (
            <p className="text-sm font-semibold text-slate-800">
              {finding.right_value || "—"}
              {finding.right_value && test.unit
                ? ` ${test.unit}`
                : ""}
            </p>
          )}

          {finding.notes && (
            <p className="mt-2 text-sm text-slate-500">
              {finding.notes}
            </p>
          )}

        </div>
      )}

      {updateMessage && (
        <p
          className={`mt-3 text-sm font-semibold ${
            updateMessage.startsWith("✓")
              ? "text-emerald-700"
              : "text-red-600"
          }`}
        >
          {updateMessage}
        </p>
      )}
    </div>
  );
})} 
  </div>
)}
      {open && (
        <div className="mt-5 space-y-5">

          {/* STEP 1 — CATEGORY */}
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">
              1. Choose Category
            </p>

            <div className="flex flex-wrap gap-2">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setCategory(item);
                    setBodyRegion(null);
                  }}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                    category === item
                      ? "border-sky-500 bg-white text-sky-800"
                      : "border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2 — BODY REGION */}
          {category && (
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">
                2. Choose Body Region
              </p>

              <div className="flex flex-wrap gap-2">
                {bodyRegions.map((region) => (
                  <button
                    key={region}
                    type="button"
                    onClick={() => setBodyRegion(region)}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                      bodyRegion === region
                        ? "border-sky-500 bg-white text-sky-800"
                        : "border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 — TEST */}
          {category && bodyRegion && (
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">
                3. Choose Test
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                {visibleTests.map((test) => {
                  const selected = selectedTests.includes(test.id);

                  return (
                    <label
                      key={test.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${
                        selected
                          ? "border-sky-400 bg-white"
                          : "border-slate-200 bg-white/70"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleTest(test.id)}
                        className="mt-1 h-4 w-4"
                      />

                      <div>
                        <p className="font-semibold text-slate-900">
                          {test.test_name}
                        </p>

                        <p className="text-xs text-slate-500">
                          {test.measurement_type}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* SELECTED TESTS */}
      {selectedTestObjects.length > 0 && (
        <div className="mt-6 border-t border-sky-200 pt-5">

          <p className="mb-3 text-sm font-semibold text-slate-700">
            Selected for this visit
          </p>

          <div className="space-y-3">
            {selectedTestObjects.map((test) => (
              <div
                key={test.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >

                <input
                  type="hidden"
                  form={formId}
                  name="retest_test_id"
                  value={test.id}
                />

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {test.test_name}
                    </p>

                    <p className="text-xs text-slate-500">
                      {test.category}
                      {" · "}
                      {test.body_region}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleTest(test.id)}
                    className="text-sm font-semibold text-red-600"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-4">
                  <AssessmentInput
                    test={test}
                    formId={formId}
                  />
                </div>

                <div className="mt-4">
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Notes
                  </label>

                  <input
                    form={formId}
                    name={`notes_${test.id}`}
                    placeholder="Optional"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
                  />
                </div>

              </div>
            ))}
            <div className="mt-5 border-t border-slate-200 pt-4">

  <button
    type="button"
    onClick={handleSaveAssessments}
    disabled={isSaving}
    className="w-full rounded-xl bg-sky-700 px-5 py-3 font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {isSaving
      ? "Saving Assessments..."
      : "Save Assessments"}
  </button>

  {saveMessage && (
    <p
      className={`mt-3 text-center text-sm font-semibold ${
        saveMessage.startsWith("✓")
          ? "text-emerald-700"
          : "text-red-600"
      }`}
    >
      {saveMessage}
    </p>
  )}

  <p className="mt-2 text-center text-xs text-slate-500">
    These assessments will be attached to this visit when you save the SOAPIE note.
  </p>

</div>
          </div>

        </div>
      )}

    </section>
  );
}

function AssessmentInput({
  test,
  formId,
}: {
  test: ClinicalTest;
  formId: string;
}) {
  if (test.input_type === "bilateral_mmt") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectInput
          formId={formId}
          label={test.right_label || "RIGHT"}
          name={`right_${test.id}`}
          values={MMT_VALUES}
        />

        <SelectInput
          formId={formId}
          label={test.left_label || "LEFT"}
          name={`left_${test.id}`}
          values={MMT_VALUES}
        />
      </div>
    );
  }

  if (test.input_type === "bilateral_select") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectInput
          formId={formId}
          label={test.right_label || "RIGHT"}
          name={`right_${test.id}`}
          values={POS_NEG_VALUES}
        />

        <SelectInput
          formId={formId}
          label={test.left_label || "LEFT"}
          name={`left_${test.id}`}
          values={POS_NEG_VALUES}
        />
      </div>
    );
  }

  if (test.input_type === "bilateral_number") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberInput
          formId={formId}
          label={test.right_label || "RIGHT"}
          name={`right_${test.id}`}
          unit={test.unit}
        />

        <NumberInput
          formId={formId}
          label={test.left_label || "LEFT"}
          name={`left_${test.id}`}
          unit={test.unit}
        />
      </div>
    );
  }

  if (test.input_type === "single_number") {
    return (
      <NumberInput
        formId={formId}
        label="RESULT"
        name={`single_${test.id}`}
        unit={test.unit}
      />
    );
  }

  if (test.input_type === "berg") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="font-semibold text-amber-900">
          Berg Balance Scale
        </p>

        <p className="mt-1 text-sm text-amber-800">
          We’ll build the full 14-item Berg scoring form next.
        </p>
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
        Result
      </label>

      <input
        form={formId}
        name={`single_${test.id}`}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
      />
    </div>
  );
}
function AssessmentEditInput({
  test,
  finding,
}: {
  test: ClinicalTest;
  finding: SavedFinding;
}) {
  if (test.input_type === "bilateral_mmt") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectInputWithDefault
          label={test.right_label || "RIGHT"}
          name={`right_${test.id}`}
          values={MMT_VALUES}
          defaultValue={finding.right_value || ""}
        />

        <SelectInputWithDefault
          label={test.left_label || "LEFT"}
          name={`left_${test.id}`}
          values={MMT_VALUES}
          defaultValue={finding.left_value || ""}
        />
      </div>
    );
  }

  if (test.input_type === "bilateral_select") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectInputWithDefault
          label={test.right_label || "RIGHT"}
          name={`right_${test.id}`}
          values={POS_NEG_VALUES}
          defaultValue={finding.right_value || ""}
        />

        <SelectInputWithDefault
          label={test.left_label || "LEFT"}
          name={`left_${test.id}`}
          values={POS_NEG_VALUES}
          defaultValue={finding.left_value || ""}
        />
      </div>
    );
  }

  if (test.input_type === "bilateral_number") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">

        <NumberInputWithDefault
          label={test.right_label || "RIGHT"}
          name={`right_${test.id}`}
          unit={test.unit}
          defaultValue={finding.right_value || ""}
        />

        <NumberInputWithDefault
          label={test.left_label || "LEFT"}
          name={`left_${test.id}`}
          unit={test.unit}
          defaultValue={finding.left_value || ""}
        />

      </div>
    );
  }

  return (
    <NumberInputWithDefault
      label="RESULT"
      name={`single_${test.id}`}
      unit={test.unit}
      defaultValue={finding.right_value || ""}
    />
  );
}
function SelectInputWithDefault({
  label,
  name,
  values,
  defaultValue,
}: {
  label: string;
  name: string;
  values: string[];
  defaultValue: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
      >
        {values.map((value) => (
          <option
            key={value}
            value={value}
          >
            {value || "Not tested"}
          </option>
        ))}
      </select>
    </div>
  );
}

function NumberInputWithDefault({
  label,
  name,
  unit,
  defaultValue,
}: {
  label: string;
  name: string;
  unit: string | null;
  defaultValue: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <div className="flex items-center gap-2">

        <input
          type="number"
          step="any"
          name={name}
          defaultValue={defaultValue}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
        />

        {unit && (
          <span className="font-semibold text-slate-500">
            {unit}
          </span>
        )}

      </div>
    </div>
  );
}
function SelectInput({
  formId,
  label,
  name,
  values,
}: {
  formId: string;
  label: string;
  name: string;
  values: string[];
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <select
        form={formId}
        name={name}
        defaultValue=""
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
      >
        {values.map((value) => (
          <option
            key={value}
            value={value}
          >
            {value || "Not tested"}
          </option>
        ))}
      </select>
    </div>
  );
}

function NumberInput({
  formId,
  label,
  name,
  unit,
}: {
  formId: string;
  label: string;
  name: string;
  unit: string | null;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <div className="flex items-center gap-2">
        <input
          form={formId}
          type="number"
          step="any"
          name={name}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
        />

        {unit && (
          <span className="font-semibold text-slate-500">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}