"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveVisitAssessments(
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const clientId = String(
    formData.get("client_id") || ""
  );

  const visitDate = String(
    formData.get("visit_date") || ""
  );

  const visitSessionId = String(
    formData.get("visit_session_id") || ""
  );

  const testIds = formData
    .getAll("retest_test_id")
    .map((value) => String(value));

  if (!clientId || !visitDate) {
    throw new Error(
      "Missing assessment information."
    );
  }

  if (testIds.length === 0) {
    throw new Error(
      "No assessments selected."
    );
  }

  const rows = testIds
    .map((testId) => {
      const rightValue = String(
        formData.get(`right_${testId}`) || ""
      ).trim();

      const leftValue = String(
        formData.get(`left_${testId}`) || ""
      ).trim();

      const singleValue = String(
        formData.get(`single_${testId}`) || ""
      ).trim();

      const notes = String(
        formData.get(`notes_${testId}`) || ""
      ).trim();

      return {
        user_id: user.id,
        client_id: clientId,
        test_id: testId,
        finding_date: visitDate,
        right_value:
          rightValue || singleValue || null,
        left_value:
          leftValue || null,
        notes: notes || null,
        visit_id: null,
        visit_session_id:
          visitSessionId || null,
      };
    })
    .filter(
      (row) =>
        row.right_value ||
        row.left_value ||
        row.notes
    );

  if (rows.length === 0) {
    throw new Error(
      "Enter at least one assessment result."
    );
  }

  const { error } = await supabase
    .from("clinical_findings")
    .insert(rows);

  if (error) {
    throw new Error(error.message);
  }

  return {
    success: true,
    count: rows.length,
  };
}

export async function updateVisitAssessment(
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const findingId = String(
    formData.get("finding_id") || ""
  );

  const testId = String(
    formData.get("test_id") || ""
  );

  const rightValue = String(
    formData.get(`right_${testId}`) || ""
  ).trim();

  const leftValue = String(
    formData.get(`left_${testId}`) || ""
  ).trim();

  const singleValue = String(
    formData.get(`single_${testId}`) || ""
  ).trim();

  const notes = String(
    formData.get(`notes_${testId}`) || ""
  ).trim();

  if (!findingId || !testId) {
    throw new Error(
      "Missing assessment information."
    );
  }

  const { error } = await supabase
    .from("clinical_findings")
    .update({
      right_value:
        rightValue || singleValue || null,
      left_value:
        leftValue || null,
      notes: notes || null,
    })
    .eq("id", findingId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  return {
    success: true,
  };
}