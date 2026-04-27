"use client";

import { useEffect, useState } from "react";
import type { Appointment } from "../lib/constants";
import { formatDayTitle } from "../lib/calendar";
import { DayTimelineVertical } from "./DayTimelineVertical";
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
  chair: number;
};

type Props = {
  open: boolean;
  date: Date | null;
  appointments: Appointment[];
  businessHours: BusinessHours;
  chairs: number;
  readOnly?: boolean;
  selectedAppointmentId?: string | null;
  onClose: () => void;
  onSelectAppointment: (a: Appointment) => void;
  onCreate: (args: SubmitArgs) => Promise<void>;
};

export function DayModal({
  open,
  date,
  appointments,
  businessHours,
  chairs,
  readOnly,
  selectedAppointmentId,
  onClose,
  onSelectAppointment,
  onCreate,
}: Props) {
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setShowForm(false);
  }, [open]);

  useEffect(() => {
    setShowForm(false);
  }, [date]);

  if (!date) return null;

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center p-4 transition-opacity duration-200 ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
      />

      <div
        role="dialog"
        aria-modal="true"
        className={`relative flex max-h-[90vh] w-full max-w-2xl transform flex-col rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-950/95 p-6 shadow-2xl transition-all duration-200 ${
          open ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-fuchsia-300/90">
              Day agenda
            </p>
            <h3 className="mt-1 text-xl font-black text-white">
              {formatDayTitle(date)}
            </h3>
            <p className="mt-1 text-sm text-slate-300">
              {appointments.length === 0
                ? "No appointments yet."
                : `${appointments.length} scheduled · tap a block for details`}
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
        </div>

        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          <DayTimelineVertical
            appointments={appointments}
            startHour={businessHours.startHour}
            endHour={businessHours.endHour}
            chairs={chairs}
            selectedId={selectedAppointmentId ?? null}
            onSelectAppointment={onSelectAppointment}
          />
          {appointments.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-slate-400">
              This day is open. Tap “New appointment” to book.
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          {readOnly ? (
            <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Past day · read-only
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-4 py-2 text-sm font-extrabold text-white shadow-lg transition hover:from-fuchsia-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/70"
            >
              {showForm ? "Hide form" : "New appointment"}
            </button>
          )}
        </div>

        {!readOnly ? (
          <div
            className={`grid transition-all duration-300 ease-out ${
              showForm ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <AppointmentForm
                  day={date}
                  businessHours={businessHours}
                  chairs={chairs}
                  dayAppointments={appointments}
                  onSubmit={async (args) => {
                    await onCreate(args);
                    setShowForm(false);
                  }}
                  submitLabel="Book appointment"
                  compact
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
