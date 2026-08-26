"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function updateClient(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const clientId = formData.get("client_id") as string;

  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;
  const dateOfBirth = formData.get("date_of_birth") as string;
  const phone = formData.get("phone") as string;
  const goals = formData.get("goals") as string;
  const precautions = formData.get("precautions") as string;

  const { error } = await supabase
    .from("clients")
    .update({
      first_name: firstName,
      last_name: lastName,
      date_of_birth:
        dateOfBirth && dateOfBirth.length > 0
          ? dateOfBirth
          : null,
      phone: phone || null,
      goals: goals || null,
      precautions: precautions || null,
    })
    .eq("id", clientId)
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    throw new Error(error.message);
  }

  redirect(`/protected/clients/${clientId}?tab=profile`);
}