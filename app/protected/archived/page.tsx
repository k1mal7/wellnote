import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { restoreClient } from "./actions";

export const instant = false;

export default async function ArchivedClientsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("archived", true)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-10">

        <Link
          href="/protected"
          className="mb-6 inline-block text-sm font-semibold text-emerald-700"
        >
          ← Back to active clients
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">
            Archived Clients
          </h1>

          <p className="mt-2 text-slate-500">
            Archived charts remain saved and can be restored at any time.
          </p>
        </div>

        <div className="space-y-4">

          {clients && clients.length > 0 ? (
            clients.map((client) => (
              <div
                key={client.id}
                className="flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {client.first_name} {client.last_name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {client.date_of_birth
                      ? `DOB: ${client.date_of_birth}`
                      : "No DOB entered"}
                  </p>
                </div>

                <div className="flex gap-2">

                  <Link
                    href={`/protected/clients/${client.id}`}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Open Chart
                  </Link>

                  <form action={restoreClient}>
                    <input
                      type="hidden"
                      name="client_id"
                      value={client.id}
                    />

                    <button
                      type="submit"
                      className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                    >
                      Restore Client
                    </button>
                  </form>

                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed bg-white p-10 text-center">
              <p className="font-semibold text-slate-700">
                No archived clients
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Clients you archive will appear here.
              </p>
            </div>
          )}

        </div>

      </div>
    </main>
  );
}