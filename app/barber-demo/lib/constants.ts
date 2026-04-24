import type { Doc } from "../../../convex/_generated/dataModel";

export type Appointment = Doc<"barberAppointments">;

export const DURATIONS = [15, 20, 30, 45, 60, 75, 90, 120];

export function computeAvailableSlots(params: {
  day: Date;
  startHour: number;
  endHour: number;
  slotMinutes: number;
  durationMinutes: number;
  dayAppointments: Appointment[];
  excludeId: string | null;
}): { value: string; label: string; startTime: number }[] {
  const {
    day,
    startHour,
    endHour,
    slotMinutes,
    durationMinutes,
    dayAppointments,
    excludeId,
  } = params;
  const base = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const startMs = new Date(base).setHours(startHour, 0, 0, 0);
  const endMs = new Date(base).setHours(endHour, 0, 0, 0);
  const durationMs = durationMinutes * 60_000;
  const slotMs = slotMinutes * 60_000;

  const slots: { value: string; label: string; startTime: number }[] = [];
  for (let t = startMs; t + durationMs <= endMs; t += slotMs) {
    const slotEnd = t + durationMs;
    const conflict = dayAppointments.some((a) => {
      if (excludeId && a._id === excludeId) return false;
      return t < a.endTime && slotEnd > a.startTime;
    });
    if (conflict) continue;
    const d = new Date(t);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    slots.push({
      value: `${hh}:${mm}`,
      label: d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
      startTime: t,
    });
  }
  return slots;
}

export function formatTimeRange(a: Appointment): string {
  const start = new Date(a.startTime).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const end = new Date(a.endTime).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${start} – ${end}`;
}

export function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function hourFractionFromDate(d: Date): number {
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

export function formatHourLabel(h: number): string {
  const suffix = h < 12 || h === 24 ? "AM" : "PM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display} ${suffix}`;
}
