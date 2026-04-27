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
  chairs: number;
};

export function DayTimelineVerticalMini({
  appointments,
  startHour,
  endHour,
  chairs,
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
        const chairIndex = (a.chair ?? 1) - 1;
        const chairWidth = 100 / chairs;
        const left = chairIndex * chairWidth + 2;
        const width = chairWidth - 4;

        return (
          <div
            key={a._id}
            className="absolute bg-gradient-to-r from-fuchsia-400 to-indigo-400 shadow-[0_0_3px_rgba(217,70,239,0.7)]"
            style={{
              top: `calc(${top}% - 1px)`,
              left: `${left}%`,
              width: `${width}%`,
              height: 2,
            }}
            title={`Chair ${a.chair ?? 1}: ${formatTime(a.startTime)} · ${a.clientName}`}
            aria-label={`Chair ${a.chair ?? 1}: ${a.clientName} at ${formatTime(a.startTime)}`}
          />
        );
      })}
    </div>
  );
}
