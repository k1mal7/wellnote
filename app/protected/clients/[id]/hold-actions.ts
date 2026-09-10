"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logAuditEvent } from "@/lib/audit-log";

type HoldState = { error: string; success: string };

export async function updateClientHold(_previous: HoldState, formData: FormData): Promise<HoldState> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Please sign in again.", success: "" };
  const clientId = String(formData.get("client_id") ?? "");
  const intent = String(formData.get("intent") ?? "");
  const returnDate = String(formData.get("return_date") ?? "");
  if (!clientId || !["hold", "reactivate"].includes(intent)) return { error: "Invalid client status change.", success: "" };
  if (returnDate && (!/^\d{4}-\d{2}-\d{2}$/.test(returnDate) || !Number.isFinite(Date.parse(returnDate)) || new Date(returnDate).toISOString().slice(0, 10) !== returnDate)) {
    return { error: "Enter a valid return date.", success: "" };
  }
  const onHold = intent === "hold";
  const { data, error } = await supabase.from("clients")
    .update({ on_hold: onHold, hold_return_date: onHold ? returnDate || null : null })
    .eq("id", clientId).eq("user_id", user.id).eq("archived", false)
    .select("id").single();
  if (error || !data) return { error: "Couldn’t update this client. Refresh and try again.", success: "" };
  await logAuditEvent({ action: onHold ? "client_put_on_hold" : "client_reactivated", entityType: "client", entityId: data.id, clientId: data.id });
  revalidatePath(`/protected/clients/${clientId}`);
  revalidatePath("/protected/clients");
  revalidatePath("/protected");
  return { error: "", success: onHold ? "Client placed on hold." : "Client reactivated." };
}
