"use client";

import { useEffect, useMemo, useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  type Appointment,
  DURATIONS,
  computeAvailableSlots,
} from "../lib/constants";
import { dayKeyFromLocalDate } from "../lib/calendar";
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
  day: Date;
  initial?: Appointment | null;
  businessHours: BusinessHours;
  chairs: number;
  dayAppointments: Appointment[];
  onSubmit: (args: SubmitArgs) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  compact?: boolean;
};

export function AppointmentForm({
  day,
  initial,
  businessHours,
  chairs,
  dayAppointments,
  onSubmit,
  onCancel,
  submitLabel,
  compact: _compact,
}: Props) {
  const initialTime = (() => {
    if (!initial) return "";
    const dt = new Date(initial.startTime);
    return `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
  })();
  const initialDur = (() => {
    if (!initial) return businessHours.slotMinutes;
    return Math.max(10, Math.round((initial.endTime - initial.startTime) / 60_000));
  })();
  const initialChair = (() => {
    if (!initial) return 1;
    return initial.chair ?? 1;
  })();

  const [time, setTime] = useState(initialTime);
  const [durationMinutes, setDurationMinutes] = useState<number>(initialDur);
  const [clientName, setClientName] = useState(initial?.clientName ?? "");
  const [phoneNumber, setPhoneNumber] = useState(initial?.phoneNumber ?? "");
  const [service, setService] = useState(initial?.service ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [chair, setChair] = useState<number>(initialChair);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const availableSlots = useMemo(
    () =>
      computeAvailableSlots({
        day,
        startHour: businessHours.startHour,
        endHour: businessHours.endHour,
        slotMinutes: businessHours.slotMinutes,
        durationMinutes,
        dayAppointments,
        excludeId: initial?._id ?? null,
        chair,
      }),
    [day, businessHours, durationMinutes, dayAppointments, initial?._id, chair],
  );

  // Auto-pick a slot when current selection is no longer valid.
  useEffect(() => {
    if (availableSlots.length === 0) return;
    if (!availableSlots.find((s) => s.value === time)) {
      setTime(availableSlots[0].value);
    }
  }, [availableSlots, time]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!time) {
      setError("Pick a time.");
      setSaving(false);
      return;
    }
    const [hhStr, mmStr] = time.split(":");
    const hh = Number(hhStr);
    const mm = Number(mmStr);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) {
      setError("Invalid time.");
      setSaving(false);
      return;
    }

    const name = clientName.trim();
    if (!name) {
      setError("Client name is required.");
      setSaving(false);
      return;
    }
    const phone = phoneNumber.trim();
    if (!phone) {
      setError("Phone number is required.");
      setSaving(false);
      return;
    }

    const startTime = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      hh,
      mm,
      0,
      0,
    ).getTime();

    try {
      await onSubmit({
        id: initial?._id ?? null,
        dayKey: dayKeyFromLocalDate(day),
        startTime,
        durationMinutes,
        clientName: name,
        phoneNumber: phone,
        service: service.trim() || undefined,
        notes: notes.trim() || undefined,
        chair,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "mt-1 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm font-semibold text-white outline-none transition focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-400/40";

  const noSlots = availableSlots.length === 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200">
          <span className="truncate">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-rose-200 transition hover:bg-rose-500/20"
          >
            ×
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-3">
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300">
            Duration
          </span>
          <select
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className={inputCls}
          >
            {DURATIONS.map((m) => (
              <option key={m} value={m}>
                {m} min
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300">
            Time
          </span>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputCls}
            disabled={noSlots}
            required
          >
            {noSlots ? (
              <option value="">No slots available</option>
            ) : (
              availableSlots.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))
            )}
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300">
            Chair
          </span>
          <select
            value={chair}
            onChange={(e) => setChair(Number(e.target.value))}
            className={inputCls}
          >
            {Array.from({ length: chairs }, (_, i) => i + 1).map((c) => (
              <option key={c} value={c}>
                Chair {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300">
          Client name
        </span>
        <input
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          className={inputCls}
          placeholder="Jordan"
          required
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300">
          Phone
        </span>
        <input
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className={inputCls}
          placeholder="(555) 123-4567"
          required
          type="tel"
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300">
          Service <span className="text-slate-500">(optional)</span>
        </span>
        <input
          value={service}
          onChange={(e) => setService(e.target.value)}
          className={inputCls}
          placeholder="Fade + Beard"
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300">
          Notes <span className="text-slate-500">(optional)</span>
        </span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={`${inputCls} min-h-[72px] resize-none`}
          placeholder="Prefers scissors on top."
        />
      </label>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={saving || noSlots}
          className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-4 py-2 text-sm font-extrabold text-white shadow-lg transition hover:from-fuchsia-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/70"
        >
          {saving ? "Saving…" : submitLabel ?? (initial ? "Save changes" : "Book appointment")}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-extrabold text-slate-100 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/70"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
