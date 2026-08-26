"use client";

import { useState } from "react";
import Link from "next/link";

import {
  addAppointment,
  updateAppointmentStatus,
} from "./actions";

type Client = {
  id: string;
  first_name: string;
  last_name: string;
};

type AppointmentClient = {
  id: string;
  first_name: string;
  last_name: string;
} | null;

type Appointment = {
  id: string;
  client_id: string | null;
  title: string | null;
  event_category: string;
  appointment_date: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  appointment_type: string | null;
  status: string;
  notes: string | null;
  recurring: boolean;
  series_id: string | null;
  clients: AppointmentClient;
};

type Props = {
  clients: Client[];
  appointments: Appointment[];
  weekStart: string;

  initialClientId?: string;
  initialDate?: string;
};

const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_HEIGHT = 72;

function parseYMD(value: string) {
  const [year, month, day] =
    value.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
}

function dateToYMD(date: Date) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(
  date: Date,
  days: number
) {
  const result =
    new Date(date);

  result.setDate(
    result.getDate() + days
  );

  return result;
}

function formatDay(date: Date) {
  return date.toLocaleDateString(
    "en-CA",
    {
      weekday: "short",
      month: "short",
      day: "numeric",
    }
  );
}

function formatWeekTitle(
  start: Date,
  end: Date
) {
  const startText =
    start.toLocaleDateString(
      "en-CA",
      {
        month: "long",
        day: "numeric",
      }
    );

  const endText =
    end.toLocaleDateString(
      "en-CA",
      {
        month: "long",
        day: "numeric",
        year: "numeric",
      }
    );

  return `${startText} – ${endText}`;
}

function formatHour(hour: number) {
  const period =
    hour >= 12 ? "PM" : "AM";

  const displayHour =
    hour % 12 || 12;

  return `${displayHour} ${period}`;
}

function formatTime(
  value: string | null
) {
  if (!value) {
    return "";
  }

  const [hourText, minute] =
    value.split(":");

  let hour =
    Number(hourText);

  const period =
    hour >= 12 ? "PM" : "AM";

  hour =
    hour % 12 || 12;

  return `${hour}:${minute} ${period}`;
}

function minutesFromTime(
  time: string
) {
  const [hour, minute] =
    time.split(":").map(Number);

  return hour * 60 + minute;
}

function getEndTime(
  appointment: Appointment
) {
  if (appointment.end_time) {
    return appointment.end_time;
  }

  const startMinutes =
    minutesFromTime(
      appointment.start_time
    );

  const endMinutes =
    startMinutes +
    (appointment.duration_minutes ||
      60);

  const hour =
    Math.floor(
      endMinutes / 60
    );

  const minute =
    endMinutes % 60;

  return `${String(hour).padStart(
    2,
    "0"
  )}:${String(minute).padStart(
    2,
    "0"
  )}`;
}

function getPosition(
  appointment: Appointment
) {
  const start =
    minutesFromTime(
      appointment.start_time
    );

  const end =
    minutesFromTime(
      getEndTime(appointment)
    );

  const calendarStart =
    START_HOUR * 60;

  const top =
    ((start -
      calendarStart) /
      60) *
    HOUR_HEIGHT;

  const duration =
    Math.max(
      30,
      end - start
    );

  const height =
    (duration / 60) *
    HOUR_HEIGHT;

  return {
    top: Math.max(0, top),
    height: Math.max(
      38,
      height
    ),
  };
}

function getEventClasses(
  appointment: Appointment
) {
  if (
    appointment.status ===
    "Completed"
  ) {
    return "border-green-300 bg-green-100 text-green-950";
  }

  if (
    appointment.status ===
    "Missed"
  ) {
    return "border-red-300 bg-red-100 text-red-950";
  }

if (
  appointment.status ===
  "Cancelled"
) {
  return "border-slate-300 bg-slate-100 text-slate-500 opacity-70";
}

  if (
    appointment.event_category ===
    "Client"
  ) {
    return "border-emerald-300 bg-emerald-100 text-emerald-950";
  }

  if (
    appointment.event_category ===
    "School"
  ) {
    return "border-blue-200 bg-blue-100 text-blue-950";
  }

  if (
    appointment.event_category ===
    "Work"
  ) {
    return "border-violet-200 bg-violet-100 text-violet-950";
  }

  return "border-slate-300 bg-slate-200 text-slate-900";
}

export default function CalendarClient({
  clients,
  appointments,
  weekStart,
  initialClientId = "",
  initialDate = "",
}: Props) {
  const start =
    parseYMD(weekStart);

  const weekDays =
    Array.from(
      { length: 7 },
      (_, index) =>
        addDays(start, index)
    );

  const weekEnd =
    weekDays[6];

  const previousWeek =
    dateToYMD(
      addDays(start, -7)
    );

  const nextWeek =
    dateToYMD(
      addDays(start, 7)
    );

  const today =
    dateToYMD(
      new Date()
    );

  const hours =
    Array.from(
      {
        length:
          END_HOUR -
          START_HOUR +
          1,
      },
      (_, index) =>
        START_HOUR + index
    );

  const [formOpen, setFormOpen] =
  useState(Boolean(initialClientId));

  const [
    selectedAppointment,
    setSelectedAppointment,
  ] =
    useState<Appointment | null>(
      null
    );

  const [
    eventCategory,
    setEventCategory,
  ] =
    useState("Client");

  const [
  eventDate,
  setEventDate,
] = useState(
  initialDate || today
);

const [
  selectedClientId,
  setSelectedClientId,
] = useState(
  initialClientId
);

  const [
    startTime,
    setStartTime,
  ] =
    useState("09:00");

  const [
    endTime,
    setEndTime,
  ] =
    useState("10:00");

  const [
    recurring,
    setRecurring,
  ] =
    useState(false);

  const [
    recurrenceEnd,
    setRecurrenceEnd,
  ] =
    useState(today);

  const [
    repeatDays,
    setRepeatDays,
  ] =
    useState<number[]>([]);



  function openBlankForm() {
    setSelectedAppointment(null);

    setEventCategory("Client");

setSelectedClientId("");

setEventDate(today);

    setStartTime("09:00");

    setEndTime("10:00");

    setRecurring(false);

    setRepeatDays([]);

    setRecurrenceEnd(today);

    setFormOpen(true);
  }

  function openSlot(
    date: string,
    hour: number
  ) {
    setSelectedAppointment(null);

    setEventDate(date);

    setEventCategory(
      "Client"
    );

    const startValue =
      `${String(hour).padStart(
        2,
        "0"
      )}:00`;

    const endValue =
      `${String(
        Math.min(
          hour + 1,
          23
        )
      ).padStart(
        2,
        "0"
      )}:00`;

    setStartTime(
      startValue
    );

    setEndTime(
      endValue
    );

    setRecurring(false);

    setRepeatDays([
      parseYMD(
        date
      ).getDay(),
    ]);

    setRecurrenceEnd(
      date
    );

    setFormOpen(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function toggleRepeatDay(
    day: number
  ) {
    setRepeatDays(
      (current) =>
        current.includes(day)
          ? current.filter(
              (item) =>
                item !== day
            )
          : [...current, day]
    );
  }

  function chooseWeekdays() {
    setRepeatDays([
      1,
      2,
      3,
      4,
      5,
    ]);
  }

  return (
    <>
      {/* WEEK CONTROLS */}

     <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">

  <div className="text-center">
    <h2 className="text-xl font-semibold text-slate-900">
      {formatWeekTitle(start, weekEnd)}
    </h2>

    <Link
      href={`/protected/calendar?week=${today}`}
      className="mt-1 inline-block text-sm font-semibold text-emerald-700"
    >
      Go to today
    </Link>
  </div>

  <div className="mt-4 flex items-center justify-between gap-3">
    <Link
      href={`/protected/calendar?week=${previousWeek}`}
      className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100"
    >
      ← Previous
    </Link>

    <Link
      href={`/protected/calendar?week=${nextWeek}`}
      className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100"
    >
      Next →
    </Link>
  </div>

</div> 

      {/* ADD BUTTON */}

      <div className="mb-6">

        <button
          type="button"
          onClick={
            openBlankForm
          }
          className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800"
        >
          + Add Event
        </button>

        <p className="mt-2 text-sm text-slate-500">
          You can also click directly
          on any empty time slot in
          the calendar.
        </p>

      </div>

      {/* ADD EVENT FORM */}

      {formOpen && (
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-5 flex items-center justify-between gap-4">

            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                New Calendar Event
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Create a client
                appointment or block off
                school, work or personal
                time.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setFormOpen(false)
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600"
            >
              Close
            </button>

          </div>

          <form
            action={
              addAppointment
            }
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          >

            {/* CATEGORY */}

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Event Type
              </label>

              <select
                name="event_category"
                value={
                  eventCategory
                }
                onChange={(event) =>
                  setEventCategory(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
              >
                <option value="Client">
                  Client Appointment
                </option>

                <option value="School">
                  School
                </option>

                <option value="Work">
                  Work
                </option>

                <option value="Personal">
                  Personal
                </option>

                <option value="Gym">
                  Gym
                </option>

                <option value="Unavailable">
                  Unavailable
                </option>
              </select>
            </div>

            {/* CLIENT */}

            {eventCategory ===
              "Client" && (
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Client
                </label>

                <select
                  name="client_id"
                  required
                  value={selectedClientId}
onChange={(event) =>
  setSelectedClientId(
    event.target.value
  )
}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
                >
                  <option value="">
                    Choose client
                  </option>

                  {clients.map(
                    (client) => (
                      <option
                        key={
                          client.id
                        }
                        value={
                          client.id
                        }
                      >
                        {
                          client.first_name
                        }{" "}
                        {
                          client.last_name
                        }
                      </option>
                    )
                  )}
                </select>
              </div>
            )}

            {/* TITLE */}

            {eventCategory !==
              "Client" && (
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Title
                </label>

                <input
                  name="title"
                  required
                  placeholder={
                    eventCategory
                  }
                  defaultValue={
                    eventCategory
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400"
                />
              </div>
            )}

            {/* DATE */}

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Start Date
              </label>

              <input
                type="date"
                name="appointment_date"
                required
                value={
                  eventDate
                }
                onChange={(event) => {
                  const value =
                    event.target.value;

                  setEventDate(
                    value
                  );

                  if (
                    !recurring
                  ) {
                    setRecurrenceEnd(
                      value
                    );
                  }
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 [color-scheme:light]"
              />
            </div>

            {/* START */}

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                From
              </label>

              <input
                type="time"
                name="start_time"
                required
                value={
                  startTime
                }
                onChange={(event) =>
                  setStartTime(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 [color-scheme:light]"
              />
            </div>

            {/* END */}

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                To
              </label>

              <input
                type="time"
                name="end_time"
                required
                value={
                  endTime
                }
                onChange={(event) =>
                  setEndTime(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 [color-scheme:light]"
              />
            </div>

            {/* VISIT TYPE */}

            {eventCategory ===
              "Client" && (
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Visit Type
                </label>

                <select
                  name="appointment_type"
                  defaultValue="Home Visit"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
                >
                  <option value="Home Visit">
                    Home Visit
                  </option>

                  <option value="Initial Evaluation">
                    Initial Evaluation
                  </option>

                  <option value="Follow-up">
                    Follow-up
                  </option>

                  <option value="Reassessment">
                    Reassessment
                  </option>

                  <option value="Virtual">
                    Virtual
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>
            )}

            {/* NOTES */}

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Notes
              </label>

              <input
                name="notes"
                placeholder="Optional..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {/* RECURRING */}

            <div className="md:col-span-2 lg:col-span-4">

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">

                <input
                  type="checkbox"
                  name="recurring"
                  checked={
                    recurring
                  }
                  onChange={(event) =>
                    setRecurring(
                      event.target.checked
                    )
                  }
                  className="h-5 w-5"
                />

                <div>
                  <p className="font-semibold text-slate-900">
                    Recurring event
                  </p>

                  <p className="text-sm text-slate-500">
                    Repeat this appointment
                    or schedule automatically.
                  </p>
                </div>

              </label>

            </div>

            {/* RECURRING OPTIONS */}

            {recurring && (
              <div className="md:col-span-2 lg:col-span-4 rounded-xl border border-slate-200 bg-slate-50 p-5">

                <div className="flex flex-wrap items-center justify-between gap-3">

                  <div>
                    <p className="font-semibold text-slate-900">
                      Repeat on
                    </p>

                    <p className="text-sm text-slate-500">
                      Choose any combination
                      of days.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      chooseWeekdays
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    Select Mon–Fri
                  </button>

                </div>

                <div className="mt-4 flex flex-wrap gap-2">

                  {[
                    [1, "Mon"],
                    [2, "Tue"],
                    [3, "Wed"],
                    [4, "Thu"],
                    [5, "Fri"],
                    [6, "Sat"],
                    [0, "Sun"],
                  ].map(
                    ([day, label]) => {

                      const dayNumber =
                        Number(day);

                      const selected =
                        repeatDays.includes(
                          dayNumber
                        );

                      return (
                        <label
                          key={
                            dayNumber
                          }
                          className={`cursor-pointer rounded-xl border px-4 py-3 text-sm font-semibold ${
                            selected
                              ? "border-emerald-600 bg-emerald-100 text-emerald-900"
                              : "border-slate-300 bg-white text-slate-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            name="repeat_days"
                            value={
                              dayNumber
                            }
                            checked={
                              selected
                            }
                            onChange={() =>
                              toggleRepeatDay(
                                dayNumber
                              )
                            }
                            className="sr-only"
                          />

                          {label}
                        </label>
                      );
                    }
                  )}

                </div>

                <div className="mt-5 max-w-xs">

                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Repeat until
                  </label>

                  <input
                    type="date"
                    name="recurrence_end_date"
                    required
                    value={
                      recurrenceEnd
                    }
                    min={
                      eventDate
                    }
                    onChange={(event) =>
                      setRecurrenceEnd(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 [color-scheme:light]"
                  />

                </div>

              </div>
            )}

            <div className="md:col-span-2 lg:col-span-4">

              <button
                type="submit"
                className="rounded-xl bg-emerald-700 px-6 py-3 font-semibold text-white hover:bg-emerald-800"
              >
                Add to Calendar
              </button>

            </div>

          </form>

        </section>
      )}

      {/* SELECTED APPOINTMENT */}

      {selectedAppointment && (
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-wrap items-start justify-between gap-4">

            <div>

              <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Calendar Event
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                {selectedAppointment.event_category ===
                "Client"
                  ? `${selectedAppointment.clients?.first_name ?? ""} ${selectedAppointment.clients?.last_name ?? ""}`
                  : selectedAppointment.title}
              </h2>

              <p className="mt-2 text-slate-600">
                {selectedAppointment.appointment_date}
                {" · "}
                {formatTime(
                  selectedAppointment.start_time
                )}
                {" – "}
                {formatTime(
                  getEndTime(
                    selectedAppointment
                  )
                )}
              </p>

              {selectedAppointment.appointment_type && (
                <p className="mt-1 text-sm text-slate-500">
                  {
                    selectedAppointment.appointment_type
                  }
                </p>
              )}

              {selectedAppointment.recurring && (
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  ↻ Recurring event
                </p>
              )}

              {selectedAppointment.notes && (
                <p className="mt-3 text-sm text-slate-600">
                  {
                    selectedAppointment.notes
                  }
                </p>
              )}

            </div>

            <button
              type="button"
              onClick={() =>
                setSelectedAppointment(
                  null
                )
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600"
            >
              Close
            </button>

          </div>

          {selectedAppointment.event_category ===
            "Client" &&
            selectedAppointment.client_id && (
              <>

                <div className="mt-5 flex flex-wrap gap-2">

                  <Link
                    href={`/protected/clients/${selectedAppointment.client_id}`}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700"
                  >
                    Open Client Chart
                  </Link>

                  <Link
                    href={`/protected/clients/${selectedAppointment.client_id}/new-visit`}
                    className="rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white"
                  >
                    Start New Visit
                  </Link>

                </div>

            <div className="mt-6 border-t border-slate-200 pt-5">

  <p className="mb-3 font-semibold text-slate-900">
    Session Status
  </p>

  <div className="flex flex-wrap gap-3">

    <form action={updateAppointmentStatus}>
      <input
        type="hidden"
        name="appointment_id"
        value={selectedAppointment.id}
      />

      <input
        type="hidden"
        name="status"
        value="Completed"
      />

      <button
        type="submit"
        className="rounded-xl border border-green-300 bg-green-50 px-4 py-2 font-semibold text-green-800 hover:bg-green-100"
      >
        ✓ Completed Session
      </button>
    </form>

    <form action={updateAppointmentStatus}>
      <input
        type="hidden"
        name="appointment_id"
        value={selectedAppointment.id}
      />

      <input
        type="hidden"
        name="status"
        value="Missed"
      />

      <button
        type="submit"
        className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 font-semibold text-red-800 hover:bg-red-100"
      >
        ✕ Missed Session
      </button>
    </form>

    <form action={updateAppointmentStatus}>
      <input
        type="hidden"
        name="appointment_id"
        value={selectedAppointment.id}
      />

      <input
        type="hidden"
        name="status"
        value="Cancelled"
      />

      <button
        type="submit"
        className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-200"
      >
        Cancel Appointment
      </button>
    </form>

    <form action={updateAppointmentStatus}>
      <input
        type="hidden"
        name="appointment_id"
        value={selectedAppointment.id}
      />

      <input
        type="hidden"
        name="status"
        value="Scheduled"
      />

      <button
        type="submit"
        className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100"
      >
        Reset to Scheduled
      </button>
    </form>

  </div>

  <p className="mt-3 text-sm text-slate-500">
    Current status:{" "}
    <strong>
      {selectedAppointment.status}
    </strong>
  </p>

</div>    

              </>
            )}

        </section>
      )}

      {/* CALENDAR */}

      <section className="w-full max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">

        <div className="w-full max-w-full overflow-x-auto">

          <div className="min-w-[1050px]">

            {/* HEADERS */}

            <div className="grid grid-cols-[80px_repeat(7,minmax(130px,1fr))] border-b border-slate-200">

              <div className="border-r border-slate-200 bg-slate-50" />

              {weekDays.map(
                (day) => {

                  const date =
                    dateToYMD(day);

                  const isToday =
                    date === today;

                  return (
                    <div
                      key={date}
                      className={`border-r border-slate-200 p-3 text-center last:border-r-0 ${
                        isToday
                          ? "bg-emerald-50"
                          : "bg-slate-50"
                      }`}
                    >
                      <p
                        className={`font-semibold ${
                          isToday
                            ? "text-emerald-800"
                            : "text-slate-800"
                        }`}
                      >
                        {formatDay(day)}
                      </p>

                      {isToday && (
                        <p className="mt-1 text-xs font-semibold text-emerald-700">
                          Today
                        </p>
                      )}
                    </div>
                  );
                }
              )}

            </div>

            {/* BODY */}

            <div className="grid grid-cols-[80px_repeat(7,minmax(130px,1fr))]">

              {/* TIMES */}

              <div
                className="relative border-r border-slate-200 bg-slate-50"
                style={{
                  height:
                    (END_HOUR -
                      START_HOUR) *
                    HOUR_HEIGHT,
                }}
              >

                {hours
                  .slice(0, -1)
                  .map((hour) => (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 border-t border-slate-200 px-2 pt-1 text-right text-xs text-slate-500"
                      style={{
                        top:
                          (hour -
                            START_HOUR) *
                          HOUR_HEIGHT,
                        height:
                          HOUR_HEIGHT,
                      }}
                    >
                      {formatHour(
                        hour
                      )}
                    </div>
                  ))}

              </div>

              {/* DAYS */}

              {weekDays.map(
                (day) => {

                  const date =
                    dateToYMD(day);

                  const isToday =
                    date === today;

                  const dayAppointments =
                    appointments.filter(
                      (
                        appointment
                      ) =>
                        appointment.appointment_date ===
                        date
                    );

                  return (
                    <div
                      key={date}
                      className={`relative border-r border-slate-200 last:border-r-0 ${
                        isToday
                          ? "bg-emerald-50/40"
                          : "bg-white"
                      }`}
                      style={{
                        height:
                          (END_HOUR -
                            START_HOUR) *
                          HOUR_HEIGHT,
                      }}
                    >

                      {/* CLICKABLE HOURS */}

                      {hours
                        .slice(0, -1)
                        .map((hour) => (
                          <button
                            key={
                              hour
                            }
                            type="button"
                            aria-label={`Add event ${date} at ${formatHour(
                              hour
                            )}`}
                            onClick={() =>
                              openSlot(
                                date,
                                hour
                              )
                            }
                            className="absolute left-0 right-0 border-t border-slate-200 text-left hover:bg-slate-100/70"
                            style={{
                              top:
                                (hour -
                                  START_HOUR) *
                                HOUR_HEIGHT,
                              height:
                                HOUR_HEIGHT,
                            }}
                          >
                            <span className="sr-only">
                              Add event
                            </span>
                          </button>
                        ))}

                      {/* EVENTS */}

                      {dayAppointments.map(
                        (
                          appointment
                        ) => {

                          const position =
                            getPosition(
                              appointment
                            );

                          const isClient =
                            appointment.event_category ===
                            "Client";

                          const displayName =
                            isClient
                              ? `${appointment.clients?.first_name ?? ""} ${appointment.clients?.last_name ?? ""}`.trim()
                              : appointment.title ||
                                appointment.event_category;

                          return (
                            <button
                              key={
                                appointment.id
                              }
                              type="button"
                              onClick={(
                                event
                              ) => {
                                event.stopPropagation();

                                setFormOpen(
                                  false
                                );

                                setSelectedAppointment(
                                  appointment
                                );

                                window.scrollTo(
                                  {
                                    top: 0,
                                    behavior:
                                      "smooth",
                                  }
                                );
                              }}
                              className={`absolute left-1 right-1 z-10 overflow-hidden rounded-lg border p-2 text-left text-xs shadow-sm transition hover:brightness-95 ${getEventClasses(
                                appointment
                              )}`}
                              style={{
                                top:
                                  position.top,
                                height:
                                  position.height,
                              }}
                            >

                              <p className="truncate font-bold">
                                {
                                  displayName
                                }
                              </p>

                              <p className="mt-0.5">
                                {formatTime(
                                  appointment.start_time
                                )}
                                {"–"}
                                {formatTime(
                                  getEndTime(
                                    appointment
                                  )
                                )}
                              </p>

                              {position.height >
                                58 && (
                                <p className="mt-1 truncate text-[11px] font-medium">
                                  {
                                    appointment.status
                                  }
                                </p>
                              )}

                            </button>
                          );
                        }
                      )}

                    </div>
                  );
                }
              )}

            </div>

          </div>

        </div>

      </section>

      <div className="mt-4 flex flex-wrap gap-5 text-xs text-slate-600">

        <span>
          <span className="mr-1 inline-block h-3 w-3 rounded bg-emerald-100" />
          Scheduled client
        </span>

        <span>
          <span className="mr-1 inline-block h-3 w-3 rounded bg-green-100" />
          Completed
        </span>

        <span>
          <span className="mr-1 inline-block h-3 w-3 rounded bg-red-100" />
          Missed
        </span>

        <span>
          <span className="mr-1 inline-block h-3 w-3 rounded bg-blue-100" />
          School
        </span>

        <span>
          <span className="mr-1 inline-block h-3 w-3 rounded bg-violet-100" />
          Work
        </span>

      </div>

    </>
  );
}