"use client";

import {
  type Appointment,
  formatTime,
  hourFractionFromDate,
} from "../lib/constants";

type Props = {
  appointments: Appointment[];
  startHour: number;
  endHour: number;
};

export function DayTimelineVerticalMini({
  appointments,
  startHour,
  endHour,
}: Props) {
  const workHours = Math.max(1, endHour - startHour);
  const noonInRange = 12 > startHour && 12 < endHour;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden bg-white/[0.02]"
      aria-label="Day timeline"
    >
      {noonInRange ? (
        <div
          className="absolute left-0 right-0 h-px bg-white/10"
          style={{ top: `${((12 - startHour) / workHours) * 100}%` }}
        />
      ) : null}

      {appointments.map((a) => {
        const startDt = new Date(a.startTime);
        const startHours = hourFractionFromDate(startDt);
        const rawTop = ((startHours - startHour) / workHours) * 100;
        const top = Math.max(0, Math.min(100, rawTop));

        return (
          <div
            key={a._id}
            className="absolute inset-x-0 bg-gradient-to-r from-fuchsia-400 to-indigo-400 shadow-[0_0_3px_rgba(217,70,239,0.7)]"
            style={{
              top: `calc(${top}% - 1px)`,
              height: 2,
            }}
            title={`${formatTime(a.startTime)} · ${a.clientName}`}
            aria-label={`${a.clientName} at ${formatTime(a.startTime)}`}
          />
        );
      })}
    </div>
  );
}
