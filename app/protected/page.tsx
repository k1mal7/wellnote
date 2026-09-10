import ClientHoldBadge from "@/components/client-hold-badge";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, CalendarDays, FilePenLine, Users } from "lucide-react";

export const instant = false;

export default async function DashboardPage({ searchParams }: {
  searchParams: Promise<{ addClient?: string }>;
}) {
  if ((await searchParams).addClient === "true") redirect("/protected/clients?addClient=true");
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/auth/login");

  // Use the clinic's current timezone for the day boundary.
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  const [clientResult, appointmentResult, draftResult] = await Promise.all([
    supabase.from("clients")
      .select("id, first_name, last_name, archived, on_hold, visits(created_at)")
      .eq("user_id", user.id)
      .eq("visits.user_id", user.id)
      .order("created_at", { ascending: false })
      .order("created_at", { referencedTable: "visits", ascending: false })
      .limit(1, { referencedTable: "visits" }),
    supabase.from("appointments").select("id, client_id, start_time, end_time").eq("user_id", user.id).eq("event_category", "Client").eq("status", "Scheduled").eq("appointment_date", today).order("start_time"),
    supabase.from("visit_sessions").select("id, client_id, visit_number, updated_at").eq("user_id", user.id).eq("status", "open").order("updated_at", { ascending: false }),
  ]);
  if (clientResult.error || appointmentResult.error || draftResult.error) {
    return <main className="px-6 py-10"><h1 className="text-3xl font-bold">Dashboard unavailable</h1><p className="mt-3 text-slate-600">We couldn’t load your workspace. Please refresh to try again.</p><Link href="/protected/clients" className="mt-5 inline-block font-semibold text-emerald-700">Go to clients →</Link></main>;
  }
  const clients = clientResult.data ?? [];
  const clientMap = new Map(clients.map(client => [client.id, client]));
  const activeClients = clients.filter(client => !client.archived);
  const appointments = (appointmentResult.data ?? []).filter(item => clientMap.has(item.client_id));
  const drafts = (draftResult.data ?? []).filter(item => clientMap.has(item.client_id));
  // Rank clinical activity first; retain creation order for clients without activity.
  const latestActivity = new Map<string, number>();
  for (const client of activeClients) {
    const savedAt = client.visits?.[0]?.created_at;
    if (savedAt) latestActivity.set(client.id, Date.parse(savedAt) || 0);
  }
  for (const draft of drafts) {
    const updatedAt = Date.parse(draft.updated_at ?? "") || 0;
    latestActivity.set(draft.client_id, Math.max(latestActivity.get(draft.client_id) ?? 0, updatedAt));
  }
  const recentClients = [...activeClients]
    .sort((a, b) => (latestActivity.get(b.id) ?? 0) - (latestActivity.get(a.id) ?? 0))
    .slice(0, 6);

  const name = (id: string) => {
    const client = clientMap.get(id);
    return `${client?.first_name ?? ""} ${client?.last_name ?? ""}`.trim();
  };
  const dateLabel = new Date(`${today}T12:00:00`).toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" });
  const cards = [
    { label: "Appointments today", value: appointments.length, icon: CalendarDays, href: "/protected/calendar" },
    { label: "Draft visits", value: drafts.length, icon: FilePenLine, href: "#draft-visits" },
    { label: "Clients", value: activeClients.length, icon: Users, href: "/protected/clients" },
  ];
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-base font-semibold text-emerald-700 sm:text-lg">{dateLabel}</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Today</h1><p className="mt-2 text-slate-500">Everything ready to pick up where you left off.</p></div>
        <Link href="/protected/clients?addClient=true" className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800">+ Add client</Link>
      </div>
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, href }) => <Link key={label} href={href} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-emerald-300"><div className="flex items-center justify-between gap-2"><p className="text-sm font-medium text-slate-500">{label}</p><Icon size={20} className="text-emerald-700" aria-hidden="true" /></div><p className="mt-2 text-2xl font-semibold">{value}</p></Link>)}
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Today’s appointments</h2><Link href={`/protected/calendar?week=${today}`} className="text-sm font-semibold text-emerald-700">View calendar →</Link></div>
          {appointments.length ? <ul className="divide-y divide-slate-100">{appointments.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-semibold">{name(item.client_id)}</p><p className="mt-1 text-sm text-slate-500">{item.start_time.slice(0, 5)}{item.end_time ? ` – ${item.end_time.slice(0, 5)}` : ""}</p></div><Link href={`/protected/clients/${item.client_id}`} className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Open chart</Link></li>)}</ul> : <p className="rounded-xl bg-slate-50 p-6 text-sm text-slate-500">No client appointments scheduled today.</p>}
        </section>
        <section id="draft-visits" className={`rounded-2xl border bg-white p-5 sm:p-6 ${drafts.length ? "border-amber-300" : "border-slate-200"}`}>
          <h2 className="text-xl font-semibold">Resume draft visits</h2><p className="mb-4 mt-1 text-sm text-slate-500">Continue your saved notes and assessments.</p>
          {drafts.length ? <ul className="divide-y divide-slate-100">{drafts.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-semibold">{name(item.client_id)}</p><p className="mt-1 text-sm text-slate-500">Visit #{item.visit_number}{clientMap.get(item.client_id)?.archived ? " · Archived client" : ""}</p></div><Link prefetch={false} href={`/protected/clients/${item.client_id}/new-visit`} className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100">Resume visit →</Link></li>)}</ul> : <p className="rounded-xl bg-slate-50 p-6 text-sm text-slate-500">You’re all caught up. No unfinished visits.</p>}
        </section>
      </div>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">Recent clients</h2><Link href="/protected/clients" className="text-sm font-semibold text-emerald-700">All clients →</Link></div>
        {activeClients.length ? <div className="grid gap-3 md:grid-cols-2">{recentClients.map(client => <Link key={client.id} href={`/protected/clients/${client.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-4 text-sm font-semibold hover:bg-slate-50"><span className="flex min-w-0 flex-wrap items-center gap-2"><span className="break-words">{name(client.id)}</span>{client.on_hold && <ClientHoldBadge />}</span><ArrowRight size={16} className="shrink-0 text-emerald-700" aria-hidden="true" /></Link>)}</div> : <p className="text-sm text-slate-500">Add your first client to start charting.</p>}
      </section>
    </main>
  );
}
