"use client";

import {
  type Appointment,
  formatHourLabel,
  formatTime,
  hourFractionFromDate,
} from "../lib/constants";

type Props = {
  appointments: Appointment[];
  startHour: number;
  endHour: number;
  chairs: number;
  selectedId?: string | null;
  onSelectAppointment: (a: Appointment) => void;
  hourHeight?: number;
};

export function DayTimelineVertical({
  appointments,
  startHour,
  endHour,
  chairs,
  selectedId,
  onSelectAppointment,
  hourHeight = 44,
}: Props) {
  const workHours = Math.max(1, endHour - startHour);
  const totalHeight = workHours * hourHeight;
  const hours = Array.from({ length: workHours }, (_, i) => startHour + i);
  const chairWidth = 100 / chairs;

  return (
    <div className="relative w-full" style={{ height: totalHeight }}>
      <div className="absolute left-0 top-0 bottom-0 w-12">
        {hours.map((h) => (
          <div
            key={h}
            style={{ height: hourHeight }}
            className="flex items-start pt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500"
          >
            {formatHourLabel(h)}
          </div>
        ))}
      </div>

      <div className="absolute left-12 right-0 top-0 bottom-0 overflow-hidden rounded-xl bg-white/[0.02] ring-1 ring-inset ring-white/5">
        {hours.slice(1).map((h) => {
          const top = (h - startHour) * hourHeight;
          return (
            <div
              key={h}
              className={`absolute left-0 right-0 h-px ${
                h === 12 ? "bg-white/15" : "bg-white/[0.05]"
              }`}
              style={{ top }}
            />
          );
        })}

        {appointments.map((a) => {
          const startDt = new Date(a.startTime);
          const startHours = hourFractionFromDate(startDt);
          const durHours = (a.endTime - a.startTime) / 3_600_000;
          const top = Math.max(0, (startHours - startHour) * hourHeight);
          const rawHeight = durHours * hourHeight;
          const height = Math.max(22, Math.min(totalHeight - top, rawHeight));
          const isSelected = selectedId && a._id === selectedId;
          const chairIndex = (a.chair ?? 1) - 1;
          const left = chairIndex * chairWidth;
          const width = chairWidth - 2;

          return (
            <button
              key={a._id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectAppointment(a);
              }}
              style={{ top, height, left: `${left}%`, width: `${width}%` }}
              className={[
                "group absolute overflow-hidden rounded-lg px-2.5 py-1 text-left shadow-md ring-1 transition-all duration-150",
                "bg-gradient-to-r from-fuchsia-600/85 to-indigo-600/85 ring-white/20 hover:from-fuchsia-500 hover:to-indigo-500 hover:shadow-[0_0_16px_rgba(217,70,239,0.45)]",
                isSelected ? "scale-[1.01] ring-fuchsia-300" : "",
                "focus:outline-none focus:ring-2 focus:ring-fuchsia-300",
              ].join(" ")}
              aria-label={`Chair ${a.chair ?? 1}: ${a.clientName} at ${formatTime(a.startTime)}`}
            >
              <div className="truncate text-[11px] font-extrabold leading-tight text-white">
                {formatTime(a.startTime)} · {a.clientName}
              </div>
              {height >= 38 ? (
                <div className="truncate text-[10px] leading-tight text-white/80">
                  {a.service || `${Math.round((a.endTime - a.startTime) / 60_000)} min`}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
