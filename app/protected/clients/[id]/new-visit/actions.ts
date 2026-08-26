"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function saveVisit(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const clientId = formData.get("client_id") as string;
  const visitNumber = Number(formData.get("visit_number"));
  const visitDate = formData.get("visit_date") as string;
  const visitTitle =
  (formData.get("visit_title") as string) || "";
  const visitSessionId = String(
  formData.get("visit_session_id") || ""
);

  const subjective =
    (formData.get("subjective") as string) || "";

  const objective =
    (formData.get("objective") as string) || "";

  const assessment =
    (formData.get("assessment") as string) || "";

  const plan =
    (formData.get("plan") as string) || "";

  const intervention =
    (formData.get("intervention") as string) || "";

  const evaluation =
    (formData.get("evaluation") as string) || "";

  // 1. SAVE THE VISIT
  const {
    data: newVisit,
    error: visitError,
  } = await supabase
    .from("visits")
    .insert({
      client_id: clientId,
      user_id: user.id,
      visit_number: visitNumber,
      visit_date: visitDate,
      visit_title: visitTitle || null,
      subjective,
      objective,
      assessment,
      plan,
      intervention,
      evaluation,
    })
    .select("id")
    .single();

  if (visitError || !newVisit) {
    console.error(visitError);

    throw new Error(
      visitError?.message || "Could not save visit."
    );
  }

  // 2. GET THE ASSESSMENTS CURRENTLY INCLUDED IN THE VISIT FORM
  const retestIds = Array.from(
    new Set(
      formData
        .getAll("retest_test_id")
        .map((value) => String(value))
    )
  );

  // 3. FIND ASSESSMENTS THAT WERE ALREADY SAVED SEPARATELY
  const {
  data: alreadySavedFindings,
  error: savedFindingsError,
} = await supabase
  .from("clinical_findings")
  .select("id, test_id")
  .eq("user_id", user.id)
  .eq("client_id", clientId)
  .eq("visit_session_id", visitSessionId)
  .is("visit_id", null);

  if (savedFindingsError) {
    await supabase
      .from("visits")
      .delete()
      .eq("id", newVisit.id)
      .eq("user_id", user.id);

    throw new Error(savedFindingsError.message);
  }

  const alreadySavedTestIds = new Set(
    (alreadySavedFindings ?? []).map(
      (finding) => finding.test_id
    )
  );

  // 4. ATTACH THOSE ALREADY-SAVED ASSESSMENTS TO THIS VISIT
  if (
    alreadySavedFindings &&
    alreadySavedFindings.length > 0
  ) {
    const savedFindingIds =
      alreadySavedFindings.map(
        (finding) => finding.id
      );

    const { error: linkError } =
      await supabase
        .from("clinical_findings")
        .update({
  visit_id: newVisit.id,
  visit_session_id: null,
})
        .in("id", savedFindingIds)
        .eq("user_id", user.id);

    if (linkError) {
      await supabase
        .from("visits")
        .delete()
        .eq("id", newVisit.id)
        .eq("user_id", user.id);

      throw new Error(linkError.message);
    }
  }

  // 5. BUILD ROWS ONLY FOR ASSESSMENTS THAT
  // WERE NOT ALREADY SAVED SEPARATELY
  const findingRows = retestIds
    .filter(
      (testId) =>
        !alreadySavedTestIds.has(testId)
    )
    .map((testId) => {
      const rightValue =
        (formData.get(
          `right_${testId}`
        ) as string) || "";

      const leftValue =
        (formData.get(
          `left_${testId}`
        ) as string) || "";

      const singleValue =
        (formData.get(
          `single_${testId}`
        ) as string) || "";

      const notes =
        (formData.get(
          `notes_${testId}`
        ) as string) || "";

      return {
        user_id: user.id,
        client_id: clientId,
        visit_id: newVisit.id,
        test_id: testId,
        finding_date: visitDate,
        right_value:
          rightValue || singleValue || null,
        left_value:
          leftValue || null,
        notes:
          notes || null,
      };
    })
    .filter(
      (finding) =>
        finding.right_value ||
        finding.left_value ||
        finding.notes
    );

  // 6. SAVE ANY UNSAVED ASSESSMENTS
  if (findingRows.length > 0) {
    const { error: findingError } =
      await supabase
        .from("clinical_findings")
        .insert(findingRows);

    if (findingError) {
      console.error(findingError);

      await supabase
        .from("visits")
        .delete()
        .eq("id", newVisit.id)
        .eq("user_id", user.id);

      throw new Error(
        findingError.message
      );
    }
  }

const { error: completeSessionError } = await supabase
  .from("visit_sessions")
  .update({
    status: "completed",
    updated_at: new Date().toISOString(),
  })
  .eq("id", visitSessionId)
  .eq("user_id", user.id);

if (completeSessionError) {
  throw new Error(completeSessionError.message);
}

redirect(
  `/protected/clients/${clientId}/visit-saved?visit=${newVisit.id}`
);
}