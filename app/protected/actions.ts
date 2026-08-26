"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addClient(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;
  const dateOfBirth = formData.get("date_of_birth") as string;
  const phone = formData.get("phone") as string;
  const goals = formData.get("goals") as string;
  const precautions = formData.get("precautions") as string;

  const { error } = await supabase
    .from("clients")
    .insert({
      user_id: user.id,
      first_name: firstName,
      last_name: lastName,

      date_of_birth:
        dateOfBirth && dateOfBirth.length > 0
          ? dateOfBirth
          : null,

      phone: phone || null,
      goals: goals || null,
      precautions: precautions || null,
    });

  if (error) {
    console.error(error);
    throw new Error(error.message);
  }

  redirect("/protected");
}