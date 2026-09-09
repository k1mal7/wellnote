import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { addClient } from "../actions";
import Link from "next/link";

export const instant = false;

function formatNextVisitDate(date: string, time: string) {
  const visitDate = new Date(`${date}T12:00:00`);

  const dateText = visitDate.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
  });

  const [hourText, minute] = time.split(":");

  let hour = Number(hourText);

  const period = hour >= 12 ? "PM" : "AM";

  hour = hour % 12 || 12;

  return `${dateText} at ${hour}:${minute} ${period}`;
}
export default async function ProtectedPage({
  searchParams,
}: {
  searchParams: Promise<{
    addClient?: string;
    q?: string;
  }>;
}) {

 const resolvedSearchParams = await searchParams;

const showAddClient =
  resolvedSearchParams.addClient === "true";
  
  
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  const { data: clients, error: clientsError } = await supabase
  .from("clients")
  .select("*")
  .eq("user_id", user.id)
  .eq("archived", false)
  .order("created_at", { ascending: false });
const today = new Date().toISOString().slice(0, 10);

const { data: upcomingAppointments, error: appointmentsError } = await supabase
  .from("appointments")
  .select(`
    id,
    client_id,
    appointment_date,
    start_time,
    status
  `)
  .eq("user_id", user.id)
  .eq("event_category", "Client")
  .gte("appointment_date", today)
  .eq("status", "Scheduled")
  .order("appointment_date", { ascending: true })
  .order("start_time", { ascending: true });
  
const { data: latestVisits, error: visitsError } = await supabase
  .from("visits")
  .select("client_id, visit_number, visit_date")
  .eq("user_id", user.id)
  .order("visit_date", { ascending: false })
  .order("visit_number", { ascending: false });
 
const { data: openVisitSessions, error: sessionsError } = await supabase
  .from("visit_sessions")
  .select("id, client_id, visit_number, updated_at")
  .eq("user_id", user.id)
  .eq("status", "open")
  .order("created_at", { ascending: false });

  if (clientsError || appointmentsError || visitsError || sessionsError) {
    return <main className="px-6 py-10"><h1 className="text-3xl font-bold">Clients unavailable</h1><p className="mt-3 text-slate-600">We couldn’t load your clients. Please refresh to try again.</p></main>;
  }

  const query = (resolvedSearchParams.q ?? "").trim().toLowerCase();
  const filteredClients = clients?.filter((client) =>
    `${client.first_name} ${client.last_name}`.toLowerCase().includes(query)
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10">

    {/* CLIENT AREA */}
<div className="mt-8">

  {/* CLIENT HEADING */}
  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">

    <div>
      <h1 className="text-3xl font-bold text-slate-900">
        Clients
      </h1>

      <p className="mt-1 text-sm text-slate-500">
        Your active client charts
      </p>
    </div>

    {!showAddClient && (
      <Link
        href="/protected/clients?addClient=true"
        className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
      >
        + Add Client
      </Link>
    )}

  </div>

  {/* ADD CLIENT FORM */}
  {showAddClient && (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="flex flex-wrap items-start justify-between gap-4">

        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Add Client
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Create a new client chart.
          </p>
        </div>

        <Link
          href="/protected/clients"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </Link>

      </div>

      <form
        action={addClient}
        className="mt-6 space-y-5"
      >

        <div className="grid gap-4 md:grid-cols-2">

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              First Name
            </label>

            <input
              type="text"
              name="first_name"
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Last Name
            </label>

            <input
              type="text"
              name="last_name"
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Date of Birth
            </label>

            <input
              type="date"
              name="date_of_birth"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 [color-scheme:light]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Phone
            </label>

            <input
              type="text"
              name="phone"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
            />
          </div>

        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Goals
          </label>

          <textarea
            name="goals"
            rows={3}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Precautions
          </label>

          <textarea
            name="precautions"
            rows={3}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-xl bg-emerald-700 px-6 py-3 font-semibold text-white hover:bg-emerald-800"
          >
            Add Client
          </button>
        </div>

      </form>

    </section>
  )}

  <form action="/protected/clients" className="mb-6 flex gap-2">
    <label htmlFor="client-search" className="sr-only">Search clients by name</label>
    <input id="client-search" name="q" defaultValue={resolvedSearchParams.q ?? ""} placeholder="Search clients by name…" className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3" />
    <button className="rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800">Search</button>
  </form>
  {/* CLIENT LIST */}
  <div className="space-y-4">

    {filteredClients && filteredClients.length > 0 ? (
      <>
        {filteredClients.map((client) => {

          const nextAppointment =
            upcomingAppointments?.find(
              (appointment) =>
                appointment.client_id === client.id
            );

          const lastVisit =
            latestVisits?.find(
              (visit) =>
                visit.client_id === client.id
            );

          const openVisitSession = openVisitSessions?.find(
  (session) => session.client_id === client.id
);

          return (
            <div
              key={client.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                <div>

                  <h3 className="text-lg font-semibold text-slate-900">
                    {client.first_name} {client.last_name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {client.date_of_birth
                      ? `DOB: ${client.date_of_birth}`
                      : "No DOB entered"}
                  </p>

                </div>

                <div className="flex flex-wrap gap-2">

                <div className="flex flex-wrap items-center gap-2">
  <Link
    prefetch={false}
    href={`/protected/clients/${client.id}/new-visit`}
    className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
  >
    {openVisitSession
      ? `Resume Visit #${openVisitSession.visit_number}`
      : "+ New Visit"}
  </Link>

  {openVisitSession && (
    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
      Draft in progress
    </span>
  )}
</div> 

                  <Link
                    href={`/protected/clients/${client.id}`}
                    className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                  >
                    Open Chart
                  </Link>

                </div>

              </div>

              <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Next Visit
                  </p>

                  <p
                    className={`mt-1 font-semibold ${
                      nextAppointment
                        ? "text-emerald-700"
                        : "text-slate-400"
                    }`}
                  >
                    {nextAppointment
                      ? formatNextVisitDate(
                          nextAppointment.appointment_date,
                          nextAppointment.start_time
                        )
                      : "Not scheduled"}
                  </p>

                </div>

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Last Visit
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {lastVisit
                      ? `Visit #${lastVisit.visit_number} · ${new Date(
                          `${lastVisit.visit_date}T12:00:00`
                        ).toLocaleDateString("en-CA", {
                          month: "short",
                          day: "numeric",
                        })}`
                      : "No visits yet"}
                  </p>

                </div>

              </div>

            </div>
          );
        })}
      </>
    ) : (

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">

        <p className="font-semibold text-slate-700">
          {query ? "No matching clients" : "No clients yet"}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          {query ? "Try a different name." : "Add your first client to get started."}
        </p>

      </div>

    )}

  </div>

</div>    
      </div>
    </main>
  );
}