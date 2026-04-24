"use client";

import { useEffect, useState } from "react";
import { type Appointment, formatTimeRange } from "../lib/constants";
import { formatDayTitle } from "../lib/calendar";
import { AppointmentForm } from "./AppointmentForm";
import type { Id } from "../../../convex/_generated/dataModel";
import type { BusinessHours } from "../lib/businessHours";

type SubmitArgs = {
  id: Id<"barberAppointments"> | null;
  dayKey: string;
  startTime: number;
  durationMinutes: number;
  clientName: string;
  phoneNumber: string;
  service?: string;
  notes?: string;
};

type Props = {
  open: boolean;
  appointment: Appointment | null;
  businessHours: BusinessHours;
  dayAppointments: Appointment[];
  transparentBackdrop?: boolean;
  onClose: () => void;
  onUpdate: (args: SubmitArgs) => Promise<void>;
  onCancelAppointment: (a: Appointment) => Promise<void>;
};

export function AppointmentSidePanel({
  open,
  appointment,
  businessHours,
  dayAppointments,
  transparentBackdrop,
  onClose,
  onUpdate,
  onCancelAppointment,
}: Props) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    setMode("view");
    setCanceling(false);
  }, [appointment?._id]);

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden
        className={`fixed inset-0 z-40 transition-opacity duration-200 ${
          transparentBackdrop ? "bg-transparent" : "bg-slate-950/50 backdrop-blur-sm"
        } ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Appointment details"
        className={`fixed right-0 top-0 bottom-0 z-50 flex w-full max-w-md transform flex-col border-l border-white/10 bg-gradient-to-b from-slate-900/98 to-slate-950/98 shadow-[0_0_60px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {appointment ? (
          <>
            <header className="flex items-start justify-between gap-3 border-b border-white/10 p-5">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-fuchsia-300/90">
                  Appointment
                </p>
                <h3 className="mt-1 truncate text-xl font-black text-white">
                  {appointment.clientName}
                </h3>
                <p className="mt-1 text-sm text-slate-300">
                  {formatDayTitle(new Date(appointment.startTime))}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-lg font-bold text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/70"
              >
                ×
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-5">
              {mode === "view" ? (
                <div className="space-y-4">
                  <Field label="Time" value={formatTimeRange(appointment)} />
                  <Field
                    label="Duration"
                    value={`${Math.round(
                      (appointment.endTime - appointment.startTime) / 60_000,
                    )} min`}
                  />
                  <Field
                    label="Service"
                    value={appointment.service || "—"}
                  />
                  <Field
                    label="Phone"
                    value={appointment.phoneNumber || "—"}
                  />
                  <Field
                    label="Notes"
                    value={appointment.notes || "—"}
                    multiline
                  />

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setMode("edit")}
                      className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-4 py-2 text-sm font-extrabold text-white shadow-lg transition hover:from-fuchsia-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/70"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={canceling}
                      onClick={async () => {
                        setCanceling(true);
                        try {
                          await onCancelAppointment(appointment);
                          onClose();
                        } finally {
                          setCanceling(false);
                        }
                      }}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-extrabold text-slate-100 transition hover:border-rose-400/40 hover:bg-rose-500/15 hover:text-rose-200 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-rose-400/70"
                    >
                      {canceling ? "Canceling…" : "Cancel appointment"}
                    </button>
                  </div>
                </div>
              ) : (
                <AppointmentForm
                  day={new Date(appointment.startTime)}
                  initial={appointment}
                  businessHours={businessHours}
                  dayAppointments={dayAppointments}
                  onSubmit={async (args) => {
                    await onUpdate(args);
                    setMode("view");
                  }}
                  onCancel={() => setMode("view")}
                  submitLabel="Save changes"
                  compact
                />
              )}
            </div>
          </>
        ) : null}
      </aside>
    </>
  );
}

function Field({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </div>
      <div
        className={`mt-1 text-sm font-semibold text-white ${
          multiline ? "whitespace-pre-wrap leading-relaxed" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
