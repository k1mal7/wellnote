import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export const instant = false;

type PageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    visit?: string;
  }>;
};

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(
    "en-CA",
    {
      weekday: "short",
      month: "short",
      day: "numeric",
    }
  );
}

function formatTime(time: string) {
  const [hourText, minute] = time.split(":");

  let hour = Number(hourText);

  const period =
    hour >= 12 ? "PM" : "AM";

  hour = hour % 12 || 12;

  return `${hour}:${minute} ${period}`;
}

export default async function VisitSavedPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;

  const query =
    await searchParams;

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: client } =
    await supabase
      .from("clients")
      .select(
        "id, first_name, last_name"
      )
      .eq("id", id)
      .single();

  if (!client) {
    notFound();
  }

  let visitNumber:
    | number
    | null = null;

  if (query.visit) {
    const { data: visit } =
      await supabase
        .from("visits")
        .select("visit_number")
        .eq("id", query.visit)
        .eq("client_id", id)
        .single();

    visitNumber =
      visit?.visit_number ?? null;
  }

  const today =
    new Date()
      .toISOString()
      .slice(0, 10);

  const {
    data: upcomingAppointments,
  } = await supabase
    .from("appointments")
    .select(`
      id,
      appointment_date,
      start_time,
      end_time,
      status
    `)
    .eq("client_id", id)
    .eq(
      "event_category",
      "Client"
    )
    .eq("status", "Scheduled")
    .gte(
      "appointment_date",
      today
    )
    .order(
      "appointment_date",
      { ascending: true }
    )
    .order(
      "start_time",
      { ascending: true }
    )
    .limit(1);

  const nextAppointment =
    upcomingAppointments?.[0] ??
    null;

  return (
    <main className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-2xl px-6 py-16">

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
            ✓
          </div>

          <h1 className="mt-6 text-3xl font-bold text-slate-900">
            {visitNumber
              ? `Visit #${visitNumber} saved`
              : "Visit saved"}
          </h1>

          <p className="mt-2 text-slate-500">
            {client.first_name}{" "}
            {client.last_name}
          </p>

          {/* NEXT APPOINTMENT */}

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">

            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Next Appointment
            </p>

            {nextAppointment ? (
              <>

                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {formatDate(
                    nextAppointment.appointment_date
                  )}
                </p>

                <p className="mt-1 text-slate-600">
                  {formatTime(
                    nextAppointment.start_time
                  )}

                  {nextAppointment.end_time && (
                    <>
                      {" – "}
                      {formatTime(
                        nextAppointment.end_time
                      )}
                    </>
                  )}
                </p>

                <Link
                  href={`/protected/calendar?week=${nextAppointment.appointment_date}`}
                  className="mt-4 inline-block text-sm font-semibold text-emerald-700"
                >
                  View in Calendar →
                </Link>

              </>
            ) : (
              <>

                <p className="mt-2 font-semibold text-slate-700">
                  No upcoming appointment
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Schedule the next visit now if needed.
                </p>

              </>
            )}

          </div>

          {/* ACTIONS */}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">

            <Link
              href={`/protected/calendar?client=${client.id}&date=${today}`}
              className="rounded-xl bg-emerald-700 px-5 py-3 text-center font-semibold text-white hover:bg-emerald-800"
            >
              {nextAppointment
                ? "Schedule Another"
                : "Schedule Next Appointment"}
            </Link>

            <Link
              href={`/protected/clients/${client.id}?tab=visits`}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center font-semibold text-slate-700 hover:bg-slate-100"
            >
              Return to Client Chart
            </Link>

          </div>

        </section>

      </div>

    </main>
  );
}