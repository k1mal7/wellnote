"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { logAuditEvent } from "@/lib/audit-log";

function dateFromYMD(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toYMD(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function addAppointment(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const eventCategory =
    (formData.get("event_category") as string) || "Client";

  const clientId =
    (formData.get("client_id") as string) || "";

  const title =
    (formData.get("title") as string) || "";

  const startDate =
    formData.get("appointment_date") as string;

  const recurrenceEndDate =
    (formData.get("recurrence_end_date") as string) || startDate;

  const startTime =
    formData.get("start_time") as string;

  const endTime =
    formData.get("end_time") as string;

  const appointmentType =
    (formData.get("appointment_type") as string) || "";

  const notes =
    (formData.get("notes") as string) || "";

  const recurring =
    formData.get("recurring") === "on";

  const repeatDays =
    formData
      .getAll("repeat_days")
      .map((day) => Number(day));

  if (!startDate || !startTime || !endTime) {
    throw new Error(
      "Date, start time and end time are required."
    );
  }

  if (endTime <= startTime) {
    throw new Error(
      "End time must be after start time."
    );
  }

  if (
    eventCategory === "Client" &&
    !clientId
  ) {
    throw new Error(
      "Choose a client for a client appointment."
    );
  }

  if (
    eventCategory !== "Client" &&
    !title.trim()
  ) {
    throw new Error(
      "Enter a title for this schedule block."
    );
  }

  const seriesId =
    recurring ? randomUUID() : null;

  const rows = [];

  if (recurring) {
    if (repeatDays.length === 0) {
      throw new Error(
        "Choose at least one weekday."
      );
    }

    const current =
      dateFromYMD(startDate);

    const end =
      dateFromYMD(recurrenceEndDate);

    while (current <= end) {
      const weekday = current.getDay();

      if (repeatDays.includes(weekday)) {
        rows.push({
          user_id: user.id,

          client_id:
            eventCategory === "Client"
              ? clientId
              : null,

          title:
            eventCategory === "Client"
              ? null
              : title.trim(),

          event_category: eventCategory,

          appointment_date:
            toYMD(current),

          start_time: startTime,
          end_time: endTime,

          appointment_type:
            eventCategory === "Client"
              ? appointmentType || null
              : eventCategory,

          status: "Scheduled",

          notes:
            notes.trim() || null,

          recurring: true,
          series_id: seriesId,
        });
      }

      current.setDate(
        current.getDate() + 1
      );
    }
  } else {
    rows.push({
      user_id: user.id,

      client_id:
        eventCategory === "Client"
          ? clientId
          : null,

      title:
        eventCategory === "Client"
          ? null
          : title.trim(),

      event_category: eventCategory,

      appointment_date: startDate,

      start_time: startTime,
      end_time: endTime,

      appointment_type:
        eventCategory === "Client"
          ? appointmentType || null
          : eventCategory,

      status: "Scheduled",

      notes:
        notes.trim() || null,

      recurring: false,
      series_id: null,
    });
  }

  const { data: createdAppointments, error } =
  await supabase
    .from("appointments")
    .insert(rows)
    .select("id, client_id");

  if (error) {
    console.error(error);
    throw new Error(error.message);
  }

  await logAuditEvent({
  action: "appointment_created",
  entityType: "appointment",
  entityId:
    createdAppointments?.length === 1
      ? createdAppointments[0].id
      : null,
  clientId:
    createdAppointments?.[0]?.client_id || null,
  details: {
    numberOfAppointments:
      createdAppointments?.length || rows.length,
    recurring,
  },
});

  revalidatePath("/protected/calendar");
}

export async function updateAppointmentStatus(
  formData: FormData
) {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    throw new Error(
      "You must be logged in."
    );
  }

  const appointmentId =
    formData.get(
      "appointment_id"
    ) as string;

  const status =
    formData.get("status") as string;

  if (
  !["Scheduled", "Completed", "Missed", "Cancelled"].includes(
    status
  )
) {
    throw new Error(
      "Invalid appointment status."
    );
  }

  const { data: updatedAppointment, error } =
  await supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId)
    .eq("user_id", user.id)
    .select("id, client_id")
    .single();

  if (error) {
    throw new Error(
      error.message
    );
  }
 
  await logAuditEvent({
  action:
    status === "Cancelled"
      ? "appointment_cancelled"
      : "appointment_updated",
  entityType: "appointment",
  entityId: updatedAppointment.id,
  clientId: updatedAppointment.client_id,
  details: {
    status,
  },
});

revalidatePath(
    "/protected/calendar"
  );
}