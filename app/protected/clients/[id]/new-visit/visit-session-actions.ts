"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { logAuditEvent } from "@/lib/audit-log";

export async function saveVisitDraft(
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const sessionId = String(
    formData.get("visit_session_id") || ""
  );

  if (!sessionId) {
    throw new Error("Missing visit session.");
  }

  const { error } = await supabase
    .from("visit_sessions")
    .update({
      visit_date:
        String(formData.get("visit_date") || "") ||
        null,

     visit_title:
  String(formData.get("visit_title") || ""),

      subjective:
        String(formData.get("subjective") || ""),

      objective:
        String(formData.get("objective") || ""),

      assessment:
        String(formData.get("assessment") || ""),

      plan:
        String(formData.get("plan") || ""),

      intervention:
        String(formData.get("intervention") || ""),

      evaluation:
        String(formData.get("evaluation") || ""),

      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .eq("status", "open");

  if (error) {
    throw new Error(error.message);
  }

  return {
    success: true,
  };
}

export async function discardVisitDraft(
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const sessionId = String(
    formData.get("visit_session_id") || ""
  );

  const clientId = String(
    formData.get("client_id") || ""
  );

  if (!sessionId || !clientId) {
    throw new Error(
      "Missing visit draft information."
    );
  }

  const { error: findingsError } = await supabase
    .from("clinical_findings")
    .delete()
    .eq("user_id", user.id)
    .eq("client_id", clientId)
    .eq("visit_session_id", sessionId)
    .is("visit_id", null);

  if (findingsError) {
    throw new Error(findingsError.message);
  }

  const { error: sessionError } = await supabase
    .from("visit_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .eq("client_id", clientId)
    .eq("status", "open");

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  await logAuditEvent({
  action: "visit_draft_discarded",
  entityType: "visit_session",
  entityId: sessionId,
  clientId,
});
revalidatePath(`/protected/clients/${clientId}`);
revalidatePath("/protected");

  redirect(
    `/protected/clients/${clientId}`
  );
}
