import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import CalendarClient from "./calendar-client";

export const instant = false;

type CalendarPageProps = {
  searchParams: Promise<{
    week?: string;
    client?: string;
    date?: string;
  }>;
};

function dateToYMD(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function getMonday(date: Date) {
  const result = new Date(date);

  const day = result.getDay();

  const difference =
    day === 0 ? -6 : 1 - day;

  result.setDate(
    result.getDate() + difference
  );

  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);

  result.setDate(
    result.getDate() + days
  );

  return result;
}

export default async function CalendarPage({
  searchParams,
}: CalendarPageProps) {
  const params = await searchParams;

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const requestedDate =
    params.week
      ? parseDate(params.week)
      : new Date();

  const weekStart =
    getMonday(requestedDate);

  const weekEnd =
    addDays(weekStart, 6);

  const { data: clients } =
    await supabase
      .from("clients")
      .select(
        "id, first_name, last_name"
      )
      .eq("archived", false)
      .order("first_name");

  const { data: appointments } =
    await supabase
      .from("appointments")
      .select(`
        id,
        client_id,
        title,
        event_category,
        appointment_date,
        start_time,
        end_time,
        duration_minutes,
        appointment_type,
        status,
        notes,
        recurring,
        series_id,
        clients (
          id,
          first_name,
          last_name
        )
      `)
      .gte(
        "appointment_date",
        dateToYMD(weekStart)
      )
      .lte(
        "appointment_date",
        dateToYMD(weekEnd)
      )
      .order(
        "appointment_date",
        { ascending: true }
      )
      .order(
        "start_time",
        { ascending: true }
      );

      const normalizedAppointments = (appointments ?? []).map((appointment) => ({
  ...appointment,
  clients: Array.isArray(appointment.clients)
    ? appointment.clients[0] ?? null
    : appointment.clients,
}));

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-slate-50">
  <div className="mx-auto w-full min-w-0 max-w-[1500px] px-4 py-8 md:px-6">

        <div className="mb-6">
          <Link
            href="/protected"
            className="text-sm font-semibold text-emerald-700"
          >
            ← Back to dashboard
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-4xl font-bold text-slate-900">
            Calendar
          </h1>

          <p className="mt-2 text-slate-500">
            Manage client appointments,
            school, work and your personal
            schedule.
          </p>
        </div>

        <CalendarClient
  clients={clients ?? []}
  appointments={normalizedAppointments}
  weekStart={dateToYMD(weekStart)}
  initialClientId={params.client ?? ""}
  initialDate={params.date ?? ""}
/>

      </div>
    </main>
  );
}