import ClientOverview, { snapshotDate, snapshotTime } from "./client-overview";
import ClientHoldBadge from "@/components/client-hold-badge";
import ClientHoldControls from "./client-hold-controls";
import ClinicalFindingsClient from "./clinical-findings-client";
import { archiveClient } from "./client-actions";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  uploadDocument,
  deleteDocument,
} from "./document-actions";
export const instant = false;

type ClientPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    tab?: string;
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

function getAge(dateOfBirth: string | null) {
  if (!dateOfBirth) return null;

  const birthDate = new Date(`${dateOfBirth}T12:00:00`);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

export default async function ClientPage({
  params,
  searchParams,
}: ClientPageProps) {
  const { id } = await params;
  const { tab: requestedTab = "overview" } = await searchParams;
  const tab = ["overview", "visits", "assessments", "progress", "documents", "exercises", "profile"].includes(requestedTab) ? requestedTab : "overview";

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Get this client.
  // RLS makes sure the logged-in user can only access their own client.
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (clientError || !client) {
    notFound();
  }

  // Get visits belonging to this client
  const { data: visits, error: visitsError } = await supabase
    .from("visits")
    .select("*")
    .eq("client_id", id)
    .eq("user_id", user.id)
    .order("visit_number", { ascending: false });

  // Get documents belonging to this client
  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select("*")
    .eq("client_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const age = getAge(client.date_of_birth);
const { data: clinicalTests, error: testsError } = await supabase
  .from("clinical_test_library")
  .select("*")
  .order("category")
  .order("body_region")
  .order("test_name");
const { data: rawFindingHistory, error: findingsError } = await supabase
  .from("clinical_findings")
  .select(`
    id,
    test_id,
    finding_date,
    created_at,
    right_value,
    left_value,
    notes,
    visit_id,
    visit_session_id,
    clinical_test_library (
      id,
      category,
      body_region,
      test_name,
      measurement_type,
      allows_right_left,
      unit,
      right_label,
      left_label
    ),
    visits (
      visit_number
    )
  `)
  .eq("client_id", id)
    .eq("user_id", user.id)
  .order("finding_date", { ascending: false })
  .order("created_at", { ascending: false });  
  const clinicalFindingHistory = (rawFindingHistory ?? []).map(finding => ({
    ...finding,
    clinical_test_library: Array.isArray(finding.clinical_test_library) ? finding.clinical_test_library[0] ?? null : finding.clinical_test_library,
    visits: Array.isArray(finding.visits) ? finding.visits[0] ?? null : finding.visits,
  }));
  const latestVisit = [...(visits ?? [])].sort((a, b) =>
    String(b.visit_date).localeCompare(String(a.visit_date)) || b.visit_number - a.visit_number
  )[0] ?? null;
const tabs = [
  {
    name: "Overview",
    value: "overview",
  },
  {
    name: "Visits",
    value: "visits",
  },
  {
    name: "Assessments",
    value: "assessments",
  },
  { name: "Progress", value: "progress" },
  {
    name: "Documents",
    value: "documents",
  },
  {
    name: "Exercises",
    value: "exercises",
  },
];

const { data: openVisitSession, error: sessionError } = await supabase
  .from("visit_sessions")
  .select("id, visit_number, updated_at")
  .eq("user_id", user.id)
  .eq("client_id", id)
  .eq("status", "open")
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const currentTime = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Toronto", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(now);
  const { data: upcomingAppointments, count: upcomingCount, error: upcomingError } = await supabase
    .from("appointments").select("id, appointment_date, start_time, appointment_type, status", { count: "exact" })
    .eq("user_id", user.id).eq("client_id", id).eq("event_category", "Client").eq("status", "Scheduled")
    .or(`appointment_date.gt.${today},and(appointment_date.eq.${today},start_time.gte.${currentTime})`)
    .order("appointment_date").order("start_time").limit(1);
  const nextAppointment = upcomingAppointments?.[0] ?? null;

  if (visitsError || documentsError || findingsError || sessionError || (tab === "assessments" && testsError)) {
    return <main className="px-6 py-10"><h1 className="text-2xl font-bold">Client chart unavailable</h1><p className="mt-3 text-slate-600">Couldn’t load the chart. Please refresh to try again.</p><Link href="/protected/clients" className="mt-4 inline-block text-emerald-700">Back to clients</Link></main>;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10">

        {/* Back */}
        <Link
          href="/protected/clients"
          className="mb-6 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-800"
        >
          ← Back to clients
        </Link>

        {/* Client header */}
<div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

  <div>
    <h1 className="text-3xl font-bold text-slate-900">
      {client.first_name} {client.last_name}
    </h1>
    <div className="mt-2">{client.archived ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Archived</span> : client.on_hold ? <ClientHoldBadge /> : <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Active</span>}</div>

    <p className="mt-2 text-slate-500">
      {age !== null ? `${age} years old · ` : ""}
      DOB: {formatDate(client.date_of_birth)}
    </p>
    <p className="mt-2 text-sm text-slate-500">Last visit: {latestVisit ? snapshotDate(latestVisit.visit_date) : "None yet"}</p>
    <p className="mt-1 text-sm text-slate-500">Next: {upcomingError ? "Unavailable" : nextAppointment ? `${snapshotDate(nextAppointment.appointment_date)} · ${snapshotTime(nextAppointment.start_time)}` : "Not scheduled"}
    </p>
  </div>

  <div className="flex flex-wrap gap-2">
    <Link href={`/protected/clients/${id}?tab=profile`} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Client Details</Link>

    <Link
      href={`/protected/clients/${id}/edit`}
      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
    >
      Edit Client
    </Link>

    <form action={archiveClient}>
      <input
        type="hidden"
        name="client_id"
        value={id}
      />

      <button
        type="submit"
        className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100"
      >
        Archive Client
      </button>
    </form>

   <div className="flex flex-wrap items-center gap-2">
  <Link
    prefetch={false}
    href={`/protected/clients/${id}/new-visit`}
    className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
  >
    {openVisitSession
      ? `Resume Draft #${openVisitSession.visit_number}`
      : "Start Visit"}
  </Link>

  {openVisitSession && (
    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
      Draft in progress
    </span>
  )}
</div> 
  </div>

</div>

        {!client.archived && typeof client.on_hold === "boolean" && <ClientHoldControls clientId={id} onHold={client.on_hold} returnDate={client.hold_return_date ?? null} upcomingCount={upcomingError ? null : upcomingCount ?? 0} />}

        {/* Tabs */}
        <div className="mb-8 flex flex-wrap gap-2">

          {tabs.map((item) => (
            <Link
              key={item.value}
              href={`/protected/clients/${id}?tab=${item.value}`}
              aria-current={tab === item.value ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                tab === item.value
                  ? "bg-emerald-700 text-white"
                  : "border bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.name}
            </Link>
          ))}

        </div>

        {tab === "overview" && <ClientOverview clientId={id} latestVisit={latestVisit} visits={visits ?? []} findings={clinicalFindingHistory} nextAppointment={nextAppointment} appointmentsError={Boolean(upcomingError)} documentCount={documents?.length ?? 0} />}
        {tab === "progress" && <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold">Progress</h2><p className="mt-3 text-sm text-slate-500">Full trends and graphs are not available yet. Recent repeated measures appear on Overview.</p><Link href={`/protected/clients/${id}?tab=assessments`} className="mt-4 inline-block text-sm font-semibold text-emerald-700">View assessment history →</Link></section>}
        {tab === "exercises" && <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold">Exercises</h2><p className="mt-3 text-sm text-slate-500">Exercise programs are not available yet. Interventions remain recorded in saved visits.</p><Link href={`/protected/clients/${id}?tab=visits`} className="mt-4 inline-block text-sm font-semibold text-emerald-700">View saved interventions →</Link></section>}

        {/* VISITS */}
        {tab === "visits" && (
          <section className="rounded-2xl border bg-white p-6 shadow-sm">

            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-slate-900">
                Visit History
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {visits?.length ?? 0} saved visit
                {(visits?.length ?? 0) === 1 ? "" : "s"}
              </p>
            </div>

         {visits && visits.length > 0 ? (
  <div className="space-y-5">

    {visits.map((visit) => {
      const visitFindings =
        clinicalFindingHistory?.filter(
          (finding) =>
            finding.visit_id === visit.id
        ) ?? [];

      return (
        <div
          key={visit.id}
          id={`visit-${visit.id}`}
          className="rounded-2xl border p-5"
        >

          <div className="mb-5 flex items-center justify-between">

            <div>
              <p className="font-bold text-slate-900">
  Visit #{visit.visit_number}
</p>

{visit.visit_title && (
  <p className="mt-1 font-semibold text-slate-700">
    {visit.visit_title}
  </p>
)}

              <p className="text-sm text-slate-500">
                {formatDate(visit.visit_date)}
              </p>
            </div>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Saved
            </span>

          </div>

          <div className="space-y-4">

            <NoteSection
              label="S — Subjective"
              value={visit.subjective}
            />

            <NoteSection
              label="O — Objective"
              value={visit.objective}
            />

            {visitFindings.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Assessments
                </p>

                <div className="space-y-2">

                  {visitFindings.map((finding) => {
                    const test =
                      finding.clinical_test_library;

                    if (!test) return null;

                    return (
                      <div
                        key={finding.id}
                        className="rounded-xl border border-sky-100 bg-sky-50 p-3"
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

                          <div className="text-sm font-semibold text-slate-800">

                            {test.allows_right_left ? (
                              <div className="flex flex-wrap gap-3">

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
                              <span>
                                {finding.right_value || "—"}
                                {finding.right_value && test.unit
                                  ? ` ${test.unit}`
                                  : ""}
                              </span>
                            )}

                          </div>
                        </div>

                        {finding.notes && (
                          <p className="mt-2 text-sm text-slate-600">
                            {finding.notes}
                          </p>
                        )}

                      </div>
                    );
                  })}

                </div>
              </div>
            )}

            <NoteSection
              label="A — Assessment"
              value={visit.assessment}
            />

            <NoteSection
              label="P — Plan"
              value={visit.plan}
            />

            <NoteSection
              label="I — Intervention"
              value={visit.intervention}
            />

            <NoteSection
              label="E — Evaluation"
              value={visit.evaluation}
            />

          </div>

        </div>
      );
    })}

  </div>
) : (
  <div className="rounded-xl border border-dashed p-10 text-center">

    <p className="font-semibold text-slate-700">
      No visits yet
    </p>

    <p className="mt-2 text-sm text-slate-500">
      Your SOAPIE visits will appear here automatically.
    </p>

  </div>
)}   
          </section>
        )}
{tab === "assessments" && (
  <div className="space-y-8">

    <ClinicalFindingsClient
      clientId={id}
      tests={clinicalTests ?? []}
    />
<section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

  <div className="mb-6">
    <h2 className="text-2xl font-semibold text-slate-900">
      Clinical Finding History
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      Latest findings are shown first. Open a test to view its full history.
    </p>
  </div>

  {clinicalFindingHistory &&
  clinicalFindingHistory.length > 0 ? (

    <div className="space-y-6">

      {Array.from(
        new Set(
          clinicalFindingHistory.map(
            (finding) =>
              finding.clinical_test_library?.category
          )
        )
      )
        .filter(Boolean)
        .map((category) => {

          const categoryFindings =
            clinicalFindingHistory.filter(
              (finding) =>
                finding.clinical_test_library?.category === category
            );

          const uniqueTests = Array.from(
            new Map(
              categoryFindings.map((finding) => [
                finding.test_id,
                finding.clinical_test_library,
              ])
            ).values()
          );

          return (
            <div key={String(category)}>

              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                {String(category)}
              </h3>

              <div className="space-y-2">

                {uniqueTests.map((test) => {
                  if (!test) return null;

                  const testHistory =
                    categoryFindings.filter(
                      (finding) =>
                        finding.test_id === test.id
                    );

                  const latest =
                    testHistory[0];

                  return (
                    <details
                      key={test.id}
                      className="group rounded-xl border border-slate-200 bg-slate-50"
                    >

                      <summary className="cursor-pointer list-none px-4 py-4">

                        <div className="flex flex-wrap items-center justify-between gap-3">

                          <div>
                            <p className="font-semibold text-slate-900">
                              {test.test_name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {test.body_region}
                              {" · "}
                              {test.measurement_type}
                            </p>
                          </div>

                          <div className="flex items-center gap-4">

                            <div className="text-right">
                              <p className="text-sm font-semibold text-slate-800">
                                {test.allows_right_left ? (
                                  <>
                                    R: {latest?.right_value || "—"}
                                    {" | "}
                                    L: {latest?.left_value || "—"}
                                  </>
                                ) : (
                                  latest?.right_value || "—"
                                )}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {testHistory.length}{" "}
                                {testHistory.length === 1
                                  ? "record"
                                  : "records"}
                              </p>
                            </div>

                            <span className="text-slate-400 transition-transform group-open:rotate-180">
                              ▼
                            </span>

                          </div>

                        </div>

                      </summary>

                      <div className="border-t border-slate-200 px-4 py-4">

                        <div className="space-y-3">

                          {testHistory.map((finding) => (

                            <div
                              key={finding.id}
                              className="rounded-lg bg-white p-4"
                            >

                              <div className="flex flex-wrap items-start justify-between gap-3">

                                <div>

                                  {test.allows_right_left ? (
                                    <p className="font-semibold text-slate-900">
                                      R: {finding.right_value || "—"}
                                      {" | "}
                                      L: {finding.left_value || "—"}
                                    </p>
                                  ) : (
                                    <p className="font-semibold text-slate-900">
                                      {finding.right_value || "—"}
                                    </p>
                                  )}

                                  {finding.notes && (
                                    <p className="mt-2 text-sm text-slate-600">
                                      {finding.notes}
                                    </p>
                                  )}

                                </div>

                                <div className="text-right">

                                  <p className="text-sm font-bold text-emerald-700">
  {new Date(
    `${finding.finding_date}T12:00:00`
  ).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}
</p>

                                  <p className="mt-1 text-xs font-semibold text-slate-500">
                                    {finding.visits?.visit_number
  ? `Visit #${finding.visits.visit_number}`
  : finding.visit_session_id &&
    openVisitSession?.id === finding.visit_session_id
  ? `Draft Visit #${openVisitSession?.visit_number}`
  : "Not linked to a visit"}
                                  </p>

                                </div>

                              </div>

                            </div>

                          ))}

                        </div>

                      </div>

                    </details>
                  );
                })}

              </div>

            </div>
          );
        })}

    </div>

  ) : (

    <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
      <p className="font-semibold text-slate-700">
        No clinical findings recorded yet.
      </p>
    </div>

   )}

  </section>

</div> 
  )}


{/* DOCUMENTS */}
{tab === "documents" && (
  <div className="space-y-6">

    {/* UPLOAD DOCUMENT */}
    <section className="rounded-2xl border bg-white p-6 shadow-sm">

      <h2 className="text-xl font-semibold text-slate-900">
        Upload Document
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Add an evaluation, assessment, imaging report, or other PDF.
      </p>

      <form
        action={uploadDocument}
        className="mt-6 grid gap-4 md:grid-cols-[220px_1fr_auto]"
      >
        <input
          type="hidden"
          name="client_id"
          value={id}
        />

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Document Type
          </label>

          <select
            name="document_type"
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
          >
            <option value="Initial Evaluation">
              Initial Evaluation
            </option>

            <option value="Reassessment">
              Reassessment
            </option>

            <option value="Berg Balance Scale">
              Berg Balance Scale
            </option>

            <option value="Vestibular Assessment">
              Vestibular Assessment
            </option>

            <option value="MRI / Imaging Report">
              MRI / Imaging Report
            </option>

            <option value="Medical Report">
              Medical Report
            </option>

            <option value="Other">
              Other
            </option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            PDF File
          </label>

          <input
            type="file"
            name="file"
            accept="application/pdf"
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-700
    file:mr-4 file:rounded-lg file:border-0
    file:bg-emerald-50 file:px-4 file:py-2
    file:font-semibold file:text-emerald-700
    hover:file:bg-emerald-100"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-700 px-5 py-2.5 font-semibold text-white hover:bg-emerald-800"
          >
            Upload PDF
          </button>
        </div>

      </form>

    </section>


{/* DOCUMENT LIST */}

<section className="rounded-2xl border bg-white p-6 shadow-sm">

  <h2 className="text-2xl font-semibold text-slate-900">
    Documents & Evaluations
  </h2>

  <p className="mt-1 text-sm text-slate-500">
    Evaluations, balance tests, imaging reports and other client documents.
  </p>

  <div className="mt-6">

    {documents && documents.length > 0 ? (

      <div className="space-y-3">

        {documents.map((document) => (

          <div
            key={document.id}
            className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
          >

            <div>

              <p className="font-semibold text-slate-900">
                {document.file_name}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {document.document_type || "Document"}
              </p>

            </div>

            <div className="flex flex-wrap gap-2">

              <Link
                href={`/protected/clients/${id}/documents/${document.id}`}
                target="_blank"
                className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                Open PDF
              </Link>

              <form action={deleteDocument}>

                <input
                  type="hidden"
                  name="client_id"
                  value={id}
                />

                <input
                  type="hidden"
                  name="document_id"
                  value={document.id}
                />

                <button
                  type="submit"
                  className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                >
                  Delete
                </button>

              </form>

            </div>

          </div>

        ))}

      </div>

    ) : (

      <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">

        <p className="font-semibold text-slate-700">
          No documents attached
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Upload an evaluation, imaging report, or another PDF using the form.
        </p>

      </div>

    )}

  </div>

</section>

</div>
)}

        {/* PROFILE */}
        {tab === "profile" && (
          <section className="rounded-2xl border bg-white p-6 shadow-sm">

            <h2 className="text-2xl font-semibold text-slate-900">
              Client Profile
            </h2>

            <div className="mt-8 grid gap-6 md:grid-cols-2">

              <ProfileField
                label="First Name"
                value={client.first_name}
              />

              <ProfileField
                label="Last Name"
                value={client.last_name}
              />

              <ProfileField
                label="Date of Birth"
                value={formatDate(client.date_of_birth)}
              />

              <ProfileField
                label="Age"
                value={age !== null ? `${age}` : "Not available"}
              />

              <ProfileField
                label="Phone"
                value={client.phone || "Not entered"}
              />

              <ProfileField
                label="Number of Visits"
                value={`${visits?.length ?? 0}`}
              />

            </div>

            <div className="mt-8 border-t pt-8">

              <p className="text-sm font-semibold text-slate-500">
                Goals
              </p>

              <p className="mt-2 whitespace-pre-wrap text-slate-800">
                {client.goals || "No goals entered."}
              </p>

            </div>

            <div className="mt-6">

              <p className="text-sm font-semibold text-slate-500">
                Precautions
              </p>

              <p className="mt-2 whitespace-pre-wrap text-slate-800">
                {client.precautions || "No precautions entered."}
              </p>

            </div>

          </section>
        )}

      </div>
    </main>
  );
}

function NoteSection({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="whitespace-pre-wrap leading-relaxed text-slate-800">
        {value || "—"}
      </p>
    </div>
  );
}

function ProfileField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-lg font-medium text-slate-900">
        {value}
      </p>
    </div>
  );
}