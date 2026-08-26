import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { updateClient } from "./actions";

export const instant = false;

type EditClientPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditClientPage({
  params,
}: EditClientPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !client) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-10">

        <Link
          href={`/protected/clients/${id}`}
          className="mb-6 inline-block text-sm font-semibold text-emerald-700"
        >
          ← Back to client chart
        </Link>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900">
              Edit Client
            </h1>

            <p className="mt-1 text-slate-500">
              Update client information and clinical details.
            </p>
          </div>

          <form action={updateClient} className="space-y-5">

            <input
              type="hidden"
              name="client_id"
              value={id}
            />

            <div className="grid gap-4 md:grid-cols-2">

              <div>
                <label className="mb-1 block text-sm font-semibold">
                  First Name
                </label>

                <input
                  name="first_name"
                  required
                  defaultValue={client.first_name}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">
                  Last Name
                </label>

                <input
                  name="last_name"
                  required
                  defaultValue={client.last_name}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
                />
              </div>

            </div>

            <div className="grid gap-4 md:grid-cols-2">

              <div>
                <label className="mb-1 block text-sm font-semibold">
                  Date of Birth
                </label>

                <input
                  name="date_of_birth"
                  type="date"
                  defaultValue={client.date_of_birth || ""}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 [color-scheme:light]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">
                  Phone
                </label>

                <input
                  name="phone"
                  defaultValue={client.phone || ""}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
                />
              </div>

            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">
                Goals
              </label>

              <textarea
                name="goals"
                rows={4}
                defaultValue={client.goals || ""}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">
                Precautions
              </label>

              <textarea
                name="precautions"
                rows={4}
                defaultValue={client.precautions || ""}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800"
            >
              Save Changes
            </button>

          </form>

        </div>
      </div>
    </main>
  );
}