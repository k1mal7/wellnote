import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { saveVisit } from "./actions";
import PreviousClinicalFindings from "./previous-clinical-findings";
import VisitAssessmentPicker from "./visit-assessment-picker";
import VisitDraftAutosave from "./visit-draft-autosave";
import { discardVisitDraft } from "./visit-session-actions";
import DiscardDraftButton from "./discard-draft-button";

export const instant = false;

type NewVisitPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: string | null) {
  if (!date) return "Not entered";

  return new Date(`${date}T12:00:00`).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function NewVisitPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    session?: string;
  }>;
}) {
  const { id } = await params;

 
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (clientError || !client) {
    notFound();
  }

  const { data: visits } = await supabase
    .from("visits")
    .select("*")
    .eq("client_id", id)
    .order("visit_number", { ascending: false });

  const previousVisit =
    visits && visits.length > 0 ? visits[0] : null;

  const nextVisitNumber =
    previousVisit?.visit_number
      ? previousVisit.visit_number + 1
      : 1;

// LOOK FOR AN UNFINISHED VISIT FIRST
const {
  data: openSession,
  error: openSessionError,
} = await supabase
  .from("visit_sessions")
  .select("*")
  .eq("user_id", user.id)
  .eq("client_id", id)
  .eq("status", "open")
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

if (openSessionError) {
  throw new Error(openSessionError.message);
}

let visitSession = openSession;

// IF THERE IS NO UNFINISHED VISIT, CREATE ONE
if (!visitSession) {
  const {
    data: createdSession,
    error: createSessionError,
  } = await supabase
    .from("visit_sessions")
    .insert({
      user_id: user.id,
      client_id: id,
      visit_number: nextVisitNumber,
      visit_date: new Date()
        .toISOString()
        .slice(0, 10),
      status: "open",
    })
    .select("*")
    .single();

  if (createSessionError || !createdSession) {
    throw new Error(
      createSessionError?.message ||
        "Could not create visit session."
    );
  }

  visitSession = createdSession;
}

const visitSessionId = visitSession.id;
const currentVisitNumber = visitSession.visit_number;

// ASSESSMENTS ALREADY SAVED DURING THIS OPEN VISIT
const { data: savedSessionFindings, error: savedSessionFindingsError } =
  await supabase
    .from("clinical_findings")
    .select(`
      id,
      test_id,
      finding_date,
      right_value,
      left_value,
      notes,
      details,
      clinical_test_library (
        id,
        category,
        body_region,
        test_name,
        measurement_type,
        allows_right_left,
        input_type,
        unit,
        right_label,
        left_label
      )
    `)
    .eq("user_id", user.id)
    .eq("client_id", id)
    .eq("visit_session_id", visitSessionId)
    .is("visit_id", null)
    .order("created_at", { ascending: false });

if (savedSessionFindingsError) {
  throw new Error(savedSessionFindingsError.message);
}

const { data: clinicalFindings } = await supabase
  .from("clinical_findings")
  .select(`
    id,
    test_id,
    finding_date,
    right_value,
    left_value,
    notes,
    clinical_test_library (
      id,
      category,
      body_region,
      test_name,
      measurement_type,
      allows_right_left
    ),
    visits (
  visit_number
  )
  `)
  .eq("client_id", id)
  .order("finding_date", { ascending: false })
  .order("created_at", { ascending: false });

  const latestClinicalFindings = (clinicalFindings ?? []).filter(
  (finding, index, array) =>
    index ===
    array.findIndex(
      (item) => item.test_id === finding.test_id
    ));

const { data: clinicalTests } = await supabase
  .from("clinical_test_library")
  .select("*")
  .order("category")
  .order("body_region")
  .order("test_name");
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10">

        <Link
          href={`/protected/clients/${id}`}
          className="mb-6 inline-block text-sm font-semibold text-emerald-700"
        >
          ← Back to client chart
        </Link>

    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

  <div>
    <h1 className="text-4xl font-bold text-slate-900">
      {visitSession.subjective ||
      visitSession.objective ||
      visitSession.assessment ||
      visitSession.plan ||
      visitSession.intervention ||
      visitSession.evaluation
        ? "Resume Visit"
        : "New Visit"}
    </h1>

    <p className="mt-2 text-slate-500">
      {client.first_name} {client.last_name} · Visit #{currentVisitNumber}
    </p>
  </div>

<form
  id="discard-draft-form"
  action={discardVisitDraft}
>
  <input
    type="hidden"
    name="client_id"
    value={id}
  />

  <input
    type="hidden"
    name="visit_session_id"
    value={visitSessionId}
  />

  <DiscardDraftButton
    formId="discard-draft-form"
  />
</form>

</div>    

        <div className="grid gap-6 lg:grid-cols-2">

          {/* LEFT SIDE */}
          <div className="space-y-6">

            {/* CLIENT PROFILE */}
            <section className="rounded-2xl border bg-white p-6 shadow-sm">

              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                Client Profile
              </p>

              <h2 className="text-xl font-semibold text-slate-900">
                Starting Context
              </h2>

              <div className="mt-5 space-y-5">

                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Goals
                  </p>

                  <p className="mt-1 whitespace-pre-wrap text-slate-800">
                    {client.goals || "No goals entered."}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Precautions
                  </p>

                  <p className="mt-1 whitespace-pre-wrap text-slate-800">
                    {client.precautions || "No precautions entered."}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Profile Summary
                  </p>

                  <div className="mt-1 rounded-xl bg-emerald-50 p-4 text-sm leading-relaxed text-slate-700">
                    {client.profile_summary ||
                      "No profile summary yet. Later this will be generated from the initial evaluation PDF."}
                  </div>
                </div>

              </div>

            </section>

            {/* PREVIOUS VISIT */}
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">

              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                Previous Visit
              </p>

              {previousVisit ? (
                <div className="space-y-6">

                  <div>
                    <p className="font-semibold text-slate-900">
                      Visit #{previousVisit.visit_number}
                    </p>

                    <p className="text-sm text-slate-500">
                      {formatDate(previousVisit.visit_date)}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-sm font-semibold text-slate-500">
                      Subjective
                    </p>

                    <p className="whitespace-pre-wrap text-slate-800">
                      {previousVisit.subjective || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-sm font-semibold text-slate-500">
                      Assessment
                    </p>

                    <p className="whitespace-pre-wrap text-slate-800">
                      {previousVisit.assessment || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-sm font-semibold text-slate-500">
                      Previous Intervention
                    </p>

                    <div className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-slate-800">
                      {previousVisit.intervention || "—"}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-sm font-semibold text-slate-500">
                      Previous Plan
                    </p>

                    <p className="whitespace-pre-wrap text-slate-800">
                      {previousVisit.plan || "—"}
                    </p>
                  </div>

                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-8 text-center">

                  <p className="font-semibold text-slate-700">
                    No previous treatment visit
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Use the client profile and evaluation as the starting context
                    for Visit #1.
                  </p>

                </div>
              )}

            </section>

 {/* PREVIOUS ASSESSMENTS */}
{latestClinicalFindings.length > 0 && (
  <PreviousClinicalFindings
    findings={latestClinicalFindings as any}
    formId="visit-form"
    clientId={id}
  visitNumber={currentVisitNumber}
  visitSessionId={visitSessionId}
  />
)}

{/* ASSESSMENTS TODAY */}
<VisitAssessmentPicker
  tests={clinicalTests ?? []}
  formId="visit-form"
  clientId={id}
  visitNumber={currentVisitNumber}
  visitSessionId={visitSessionId}
  savedFindings={savedSessionFindings ?? []}
/>
</div>
          {/* SOAPIE FORM */}
          <section className="rounded-2xl border bg-white p-6 shadow-sm">

            <h2 className="text-2xl font-semibold text-slate-900">
              SOAPIE Note
            </h2>

            <p className="mb-6 mt-1 text-sm text-slate-500">
              Document Visit #{currentVisitNumber}
            </p>

            <form
  id="visit-form"
  action={saveVisit}
  className="space-y-5"
>

              <input
                type="hidden"
                name="client_id"
                value={id}
              />

              <input
                type="hidden"
                name="visit_number"
                value={currentVisitNumber}
                />
 <input
  type="hidden"
  name="visit_session_id"
  value={visitSessionId}
              />
<VisitDraftAutosave
    formId="visit-form"
  />
              <div>
                <label className="mb-1 block text-sm font-semibold">
                  Visit date
                </label>

                <input
                  type="date"
                  name="visit_date"
                  required
                  defaultValue={
  visitSession.visit_date ||
  new Date().toISOString().slice(0, 10)
}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 [color-scheme:light]"
                />
              </div>
<div>
  <label className="mb-1 block text-sm font-semibold text-slate-700">
    Visit name
    <span className="ml-1 font-normal text-slate-400">
      (optional)
    </span>
  </label>

  <input
    type="text"
    name="visit_title"
    defaultValue={visitSession.visit_title || ""}
    placeholder="e.g. Knee Reassessment"
    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
  />
</div>
              <SoapField
                name="subjective"
                label="S — Subjective"
                placeholder="What the client reports..."
                defaultValue={visitSession.subjective || ""}
              />

              <SoapField
                name="objective"
                label="O — Objective"
                placeholder="Measures, observations, reassessments..."
                defaultValue={visitSession.objective || ""}
              />

              <SoapField
                name="assessment"
                label="A — Assessment"
                placeholder="Your interpretation of progress and current limitations..."
                defaultValue={visitSession.assessment || ""}
              />

              <SoapField
                name="plan"
                label="P — Plan"
                placeholder="What you plan to continue, progress, or reassess..."
                defaultValue={visitSession.plan || ""}
              />

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
  I — Intervention / Exercise Log
</label>

                <textarea
                  name="intervention"
                  rows={8}
                  required
                  defaultValue={
  visitSession.intervention ||
  previousVisit?.intervention ||
  ""
}
                  placeholder={`Leg extension — 2 x 10, yellow band
Sit-to-stand — 2 x 10
Lower-back traction — 2 min
Tandem stance — 3 x 30 sec`}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />

                {previousVisit && (
                  <p className="mt-2 text-xs text-slate-500">
                    Previous intervention has been copied in automatically.
                    Change anything you progressed today.
                  </p>
                )}
              </div>

              <SoapField
                name="evaluation"
                label="E — Evaluation"
                placeholder="How the client responded to the session..."
                defaultValue={visitSession.evaluation || ""}
              />

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800"
              >
                Save Visit #{currentVisitNumber}
              </button>

            </form>

          </section>

        </div>
      </div>
    </main>
  );
}

function SoapField({
  name,
  label,
  placeholder,
  defaultValue = "",
}: {
  name: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <textarea
        name={name}
        rows={4}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      />
    </div>
  );
}