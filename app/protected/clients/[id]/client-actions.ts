"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logAuditEvent } from "@/lib/audit-log";

export async function archiveClient(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const clientId = formData.get("client_id") as string;

  const { error } = await supabase
    .from("clients")
    .update({
      archived: true,
    })
    .eq("id", clientId)
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    throw new Error(error.message);
  }
await logAuditEvent({
  action: "client_archived",
  entityType: "client",
  entityId: clientId,
  clientId,
});
  redirect("/protected");
}