"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logAuditEvent } from "@/lib/audit-log";

export async function saveClinicalFindings(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const clientId = formData.get("client_id") as string;
  const findingDate = formData.get("finding_date") as string;

  const selectedTests = formData.getAll("selected_test");

  if (selectedTests.length === 0) {
    throw new Error("Choose at least one clinical finding.");
  }

  const rows = selectedTests.map((testIdValue) => {
    const testId = String(testIdValue);

    const rightValue =
      (formData.get(`right_${testId}`) as string) || "";

    const leftValue =
      (formData.get(`left_${testId}`) as string) || "";

    const singleValue =
      (formData.get(`single_${testId}`) as string) || "";

    const notes =
      (formData.get(`notes_${testId}`) as string) || "";

    return {
      user_id: user.id,
      client_id: clientId,
      test_id: testId,
      finding_date: findingDate,
      right_value: rightValue || singleValue || null,
      left_value: leftValue || null,
      notes: notes || null,
    };
  });

  const { error } = await supabase
    .from("clinical_findings")
    .insert(rows);

  if (error) {
    console.error(error);
    throw new Error(error.message);
  }
await logAuditEvent({
  action: "assessment_saved",
  entityType: "clinical_findings",
  clientId,
  details: {
    numberOfFindings: rows.length,
  },
});
  revalidatePath(`/protected/clients/${clientId}`);
}