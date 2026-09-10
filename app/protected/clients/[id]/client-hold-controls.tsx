"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Pause } from "lucide-react";
import { updateClientHold } from "./hold-actions";

export default function ClientHoldControls({ clientId, onHold, returnDate, upcomingCount }: {
  clientId: string; onHold: boolean; returnDate: string | null; upcomingCount: number | null;
}) {
  const [state, action, pending] = useActionState(updateClientHold, { error: "", success: "" });
  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
      <details key={String(onHold)} open={onHold || undefined}>
        <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600"><Pause size={15} aria-hidden="true" />{onHold ? "Client is on hold" : "Put client on hold"}</summary>
        <p className="mt-3 text-sm text-slate-500">A temporary pause. Records remain accessible and appointments stay scheduled.</p>
        {onHold && returnDate && <p className="mt-2 text-sm text-slate-600">Expected return: {new Date(`${returnDate}T12:00:00`).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" })}. Reactivate when they return.</p>}
        {(upcomingCount === null || upcomingCount > 0) && <p className="mt-2 text-sm text-slate-600">{upcomingCount === null ? "We couldn’t check upcoming appointments." : `${upcomingCount} upcoming scheduled appointment${upcomingCount === 1 ? "" : "s"}.`} <Link href="/protected/calendar" className="font-semibold text-emerald-700">Review calendar →</Link></p>}
        <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="client_id" value={clientId} />
          <input type="hidden" name="intent" value={onHold ? "reactivate" : "hold"} />
          {!onHold && <div><label htmlFor="hold-return-date" className="mb-1 block text-sm font-medium">Expected return (optional)</label><input id="hold-return-date" type="date" name="return_date" className="rounded-lg border border-slate-300 bg-white px-3 py-2 [color-scheme:light]" /></div>}
          <button disabled={pending} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50">{pending ? "Saving…" : onHold ? "Reactivate client" : "Put on hold"}</button>
        </form>
      </details>
      {state.error && <p role="alert" className="mt-2 text-sm text-red-700">{state.error}</p>}
      {state.success && <p role="status" className="mt-2 text-sm text-slate-600">{state.success}</p>}
    </div>
  );
}
