import Link from "next/link";
import { displayFindingValue, recentProgress, type SnapshotFinding } from "./recent-progress";

type Visit = {
  id: string; visit_number: number; visit_date: string; visit_title: string | null;
  subjective: string | null; assessment: string | null; evaluation: string | null;
  plan: string | null; intervention: string | null;
};
type Appointment = { appointment_date: string; start_time: string; appointment_type: string | null; status: string };

export function snapshotDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}
export function snapshotTime(time: string) {
  const [hour, minute] = time.split(":");
  return `${Number(hour) % 12 || 12}:${minute} ${Number(hour) >= 12 ? "PM" : "AM"}`;
}

export default function ClientOverview({ clientId, latestVisit, visits, findings, nextAppointment, appointmentsError, documentCount }: {
  clientId: string; latestVisit: Visit | null; visits: Visit[]; findings: SnapshotFinding[];
  nextAppointment: Appointment | null; appointmentsError: boolean; documentCount: number;
}) {
  const progress = recentProgress(findings, new Set(visits.map(visit => visit.id)));
  const keyFindings = findings.filter(f => f.visit_id === latestVisit?.id && !f.visit_session_id && f.clinical_test_library).slice(0, 3);
  const visitLink = latestVisit ? `/protected/clients/${clientId}?tab=visits#visit-${latestVisit.id}` : `/protected/clients/${clientId}?tab=visits`;
  const card = "flex flex-col lg:h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6";
  return (
    <div className="grid items-start gap-5 lg:grid-cols-2 lg:items-stretch">
      <section className={card}>
        <h2 className="text-xl font-semibold">Recent progress</h2>
        <p className="mt-1 text-sm text-slate-500">Repeated measurements from saved visits.</p>
        {progress.length ? <ul className="mt-4 divide-y divide-slate-100">{progress.map(item => <li key={item.testId} className="py-3">
          <p className="font-semibold">{item.name}</p>
          <p className="mt-1 text-xs text-slate-500">{snapshotDate(item.previousDate)} → {snapshotDate(item.latestDate)}</p>
          {item.values.map(value => <div key={value.side} className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>{value.label && <span className="font-medium">{value.label}: </span>}{displayFindingValue(value.before, item.unit)} → {displayFindingValue(value.after, item.unit)}</span>
            <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-700">{value.delta}{value.unit ? ` ${value.unit}` : ""}</span>
          </div>)}
        </li>)}</ul> : <p className="mt-4 flex items-center justify-center rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500 lg:flex-1">No repeated measures yet.</p>}
        <Link href={`/protected/clients/${clientId}?tab=assessments`} className="mt-4 inline-block text-sm font-semibold text-emerald-700">View assessment history →</Link>
      </section>
      <section className={card}>
        <h2 className="text-xl font-semibold">Latest visit</h2>
        {latestVisit ? <div className="mt-4 space-y-4">
          <div><p className="font-semibold">Visit #{latestVisit.visit_number}{latestVisit.visit_title ? ` · ${latestVisit.visit_title}` : ""}</p><p className="mt-1 text-sm text-slate-500">{snapshotDate(latestVisit.visit_date)}</p></div>
          <Preview label="Subjective" value={latestVisit.subjective} />
          {keyFindings.length > 0 && <div><h3 className="text-sm font-semibold text-slate-500">Key findings</h3><ul className="mt-2 space-y-2 text-sm">{keyFindings.map(finding => {
            const test = finding.clinical_test_library!;
            return <li key={finding.id} className="rounded-lg bg-slate-50 p-3"><span className="font-semibold">{test.test_name}: </span>{test.allows_right_left ? `${test.right_label || "Right"}: ${displayFindingValue(finding.right_value, test.unit)} · ${test.left_label || "Left"}: ${displayFindingValue(finding.left_value, test.unit)}` : displayFindingValue(finding.right_value, test.unit)}</li>;
          })}</ul></div>}
          <Preview label={latestVisit.evaluation ? "Evaluation" : "Assessment"} value={latestVisit.evaluation || latestVisit.assessment} />
          <Link href={visitLink} className="inline-block rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">View full visit →</Link>
        </div> : <p className="mt-4 flex items-center justify-center rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500 lg:flex-1">No finalized visits yet.</p>}
      </section>
      <section className={card}><h2 className="text-xl font-semibold">Current plan</h2><p className="mt-3 line-clamp-6 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">{latestVisit?.plan || "No plan recorded yet."}</p>{latestVisit?.plan && <Link href={visitLink} className="mt-4 inline-block text-sm font-semibold text-emerald-700">View in full visit →</Link>}</section>
      <section className={card}><h2 className="text-xl font-semibold">Last intervention</h2><p className="mt-3 line-clamp-6 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">{latestVisit?.intervention || "No intervention recorded yet."}</p>{latestVisit?.intervention && <Link href={visitLink} className="mt-4 inline-block text-sm font-semibold text-emerald-700">View in full visit →</Link>}</section>
      <section className={card}><h2 className="text-xl font-semibold">Next appointment</h2>{appointmentsError ? <p className="mt-3 text-sm text-slate-500">Couldn’t load appointments. Please refresh to try again.</p> : nextAppointment ? <div className="mt-3"><p className="font-semibold">{snapshotDate(nextAppointment.appointment_date)} · {snapshotTime(nextAppointment.start_time)}</p><p className="mt-1 text-sm text-slate-500">{[nextAppointment.appointment_type, nextAppointment.status].filter(Boolean).join(" · ")}</p></div> : <p className="mt-3 text-sm text-slate-500">No upcoming appointment scheduled.</p>}<Link href={nextAppointment ? `/protected/calendar?week=${nextAppointment.appointment_date}` : `/protected/calendar?client=${clientId}`} className="mt-4 inline-block text-sm font-semibold text-emerald-700">{nextAppointment ? "View calendar →" : "Schedule appointment →"}</Link></section>
      <section className={card}><h2 className="text-xl font-semibold">Supporting care</h2><Link href={`/protected/clients/${clientId}?tab=documents`} className="mt-4 block text-sm font-semibold text-emerald-700">{documentCount} document{documentCount === 1 ? "" : "s"} →</Link><Link href={`/protected/clients/${clientId}?tab=exercises`} className="mt-4 block text-sm font-semibold text-emerald-700">Exercises →</Link><p className="mt-1 text-sm text-slate-500">Exercise programs are not available yet.</p></section>
    </div>
  );
}

function Preview({ label, value }: { label: string; value: string | null }) {
  return <div><h3 className="text-sm font-semibold text-slate-500">{label}</h3><p className="mt-1 line-clamp-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">{value || "Not recorded."}</p></div>;
}
