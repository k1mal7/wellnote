import { createClient } from "@/lib/supabase/server";

type AuditLogInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  clientId?: string | null;
  details?: Record<string, unknown> | null;
};

export async function logAuditEvent({
  action,
  entityType,
  entityId = null,
  clientId = null,
  details = null,
}: AuditLogInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase.from("audit_logs").insert({
    user_id: user.id,
    client_id: clientId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  });

  if (error) {
    console.error("Audit log error:", error);
  }
}