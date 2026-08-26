"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addAssessment(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const clientId =
    formData.get("client_id") as string;

  const assessmentType =
    formData.get("assessment_type") as string;

  const assessmentDate =
    formData.get("assessment_date") as string;

  const scoreValue =
    formData.get("score") as string;

  const scoreUnit =
    formData.get("score_unit") as string;

  const notes =
    formData.get("notes") as string;

  const score =
    scoreValue && scoreValue.length > 0
      ? Number(scoreValue)
      : null;

  const { error } = await supabase
    .from("assessments")
    .insert({
      client_id: clientId,
      user_id: user.id,
      assessment_type: assessmentType,
      assessment_date: assessmentDate,
      score,
      score_unit:
        scoreUnit || null,
      notes:
        notes || null,
    });

  if (error) {
    console.error(error);
    throw new Error(error.message);
  }

  revalidatePath(
    `/protected/clients/${clientId}`
  );
}